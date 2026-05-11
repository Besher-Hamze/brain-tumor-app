import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { ReportStatus } from 'src/common/enums/report-status.enum';
import { UserRole } from 'src/common/enums/role.enum';
import { AnalysisService } from '../analysis/analysis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PatientsService } from '../patients/patients.service';
import { ScansService } from '../scans/scans.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report, ReportDocument } from './schemas/report.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private readonly analysisService: AnalysisService,
    private readonly notificationsService: NotificationsService,
    private readonly patientsService: PatientsService,
    private readonly scansService: ScansService,
  ) {}

  async create(
    dto: CreateReportDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ReportDocument> {
    if (currentUserRole !== UserRole.DOCTOR && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only doctors and admins can create reports');
    }

    const patient = await this.patientsService.findOne(
      dto.patient_id,
      currentUserId,
      currentUserRole,
    );
    const scan = await this.scansService.findOne(
      dto.scan_id,
      currentUserId,
      currentUserRole,
    );
    const analysis = await this.analysisService.findOne(
      dto.analysis_id,
      currentUserId,
      currentUserRole,
    );

    if (this.extractObjectId(scan.patient) !== dto.patient_id) {
      throw new ForbiddenException('Scan does not belong to this patient');
    }

    if (this.extractObjectId(analysis.scan) !== dto.scan_id) {
      throw new ForbiddenException('Analysis does not belong to this scan');
    }

    const existing = await this.reportModel.findOne({ scan: dto.scan_id }).exec();
    if (existing) throw new ConflictException('Report already exists for this scan');

    const report = await this.reportModel.create({
      patient: new Types.ObjectId(dto.patient_id),
      scan: new Types.ObjectId(dto.scan_id),
      analysis: new Types.ObjectId(dto.analysis_id),
      doctor:
        currentUserRole === UserRole.ADMIN
          ? patient.doctor
          : new Types.ObjectId(currentUserId),
      diagnosis: dto.diagnosis,
      treatment_plan: dto.treatment_plan,
      notes: dto.notes,
      status: dto.status || ReportStatus.PUBLISHED,
    });

    if (report.status === ReportStatus.PUBLISHED) {
      await this.notifyPatientReportReady(
        report._id.toString(),
        this.extractObjectId(patient.user),
      );
    }

    return this.populateReport(report._id.toString());
  }

  async findAll(
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ReportDocument[]> {
    const filter = await this.buildAccessFilter(currentUserId, currentUserRole);

    return this.reportModel
      .find(filter)
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('scan')
      .populate('analysis')
      .populate('doctor', 'full_name email specialty')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByPatient(
    patientId: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ReportDocument[]> {
    if (currentUserRole !== UserRole.ADMIN) {
      await this.patientsService.findOne(patientId, currentUserId, currentUserRole);
    }

    return this.reportModel
      .find({ patient: patientId })
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('scan')
      .populate('analysis')
      .populate('doctor', 'full_name email specialty')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByScan(
    scanId: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ReportDocument> {
    await this.scansService.findOne(scanId, currentUserId, currentUserRole);

    const report = await this.reportModel
      .findOne({ scan: scanId })
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('scan')
      .populate('analysis')
      .populate('doctor', 'full_name email specialty')
      .exec();

    if (!report) throw new NotFoundException(`Report for scan "${scanId}" not found`);
    return report;
  }

  async findOne(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ReportDocument> {
    const report = await this.reportModel.findById(id).exec();
    if (!report) throw new NotFoundException(`Report "${id}" not found`);

    await this.scansService.findOne(
      report.scan.toString(),
      currentUserId,
      currentUserRole,
    );

    return this.populateReport(id);
  }

  async update(
    id: string,
    dto: UpdateReportDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ReportDocument> {
    if (currentUserRole === UserRole.PATIENT) {
      throw new ForbiddenException('Patients cannot update reports');
    }

    const current = await this.findOne(id, currentUserId, currentUserRole);
    const wasPublished = current.status === ReportStatus.PUBLISHED;

    const updated = await this.reportModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) throw new NotFoundException(`Report "${id}" not found`);

    if (!wasPublished && updated.status === ReportStatus.PUBLISHED) {
      const patient = await this.patientsService.findOne(
        this.extractObjectId(updated.patient),
        currentUserId,
        currentUserRole,
      );
      await this.notifyPatientReportReady(
        updated._id.toString(),
        this.extractObjectId(patient.user),
      );
    }

    return this.populateReport(id);
  }

  async delete(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ReportDocument> {
    if (currentUserRole === UserRole.PATIENT) {
      throw new ForbiddenException('Patients cannot delete reports');
    }

    await this.findOne(id, currentUserId, currentUserRole);

    const deleted = await this.reportModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`Report "${id}" not found`);
    return deleted;
  }

  private async buildAccessFilter(
    currentUserId: string,
    currentUserRole: string,
  ) {
    if (currentUserRole === UserRole.ADMIN) return {};

    if (currentUserRole === UserRole.DOCTOR) {
      const patientIds = await this.patientsService.findIdsByDoctor(currentUserId);
      return { patient: { $in: patientIds } };
    }

    if (currentUserRole === UserRole.PATIENT) {
      const patient = await this.patientsService.findByUserId(currentUserId);
      return { patient: patient._id };
    }

    throw new ForbiddenException('Access denied to reports');
  }

  private async notifyPatientReportReady(
    reportId: string,
    patientUserId: string,
  ): Promise<void> {
    await this.notificationsService.createForUser(
      patientUserId,
      NotificationType.REPORT_READY,
      'Your doctor report is ready.',
      { report_id: reportId },
    );
  }

  private async populateReport(id: string): Promise<ReportDocument> {
    const report = await this.reportModel
      .findById(id)
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('scan')
      .populate('analysis')
      .populate('doctor', 'full_name email specialty')
      .exec();

    if (!report) throw new NotFoundException(`Report "${id}" not found`);
    return report;
  }

  private extractObjectId(value: unknown): string {
    if (value instanceof Types.ObjectId) return value.toString();
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && '_id' in value) {
      return String((value as { _id: unknown })._id);
    }
    return String(value);
  }
}
