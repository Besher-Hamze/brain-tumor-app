import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from 'src/common/enums/role.enum';
import { PatientsService } from '../patients/patients.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { UpdateScanDto } from './dto/update-scan.dto';
import { Scan, ScanDocument } from './schemas/scan.schema';

@Injectable()
export class ScansService {
  constructor(
    @InjectModel(Scan.name) private scanModel: Model<ScanDocument>,
    private readonly patientsService: PatientsService,
  ) {}

  async create(
    dto: CreateScanDto,
    file: Express.Multer.File,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ScanDocument> {
    if (currentUserRole !== UserRole.DOCTOR) {
      throw new ForbiddenException('Only doctors can upload scans');
    }

    if (!file) {
      throw new NotFoundException('File is required');
    }

    const patient = await this.patientsService.findOne(
      dto.patient_id,
      currentUserId,
      currentUserRole,
    );

    const relativePath = `scans/${file.filename}`;
    const fileUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${relativePath}`;

    return this.scanModel.create({
      patient: patient._id,
      uploaded_by: new Types.ObjectId(currentUserId),
      type: dto.type,
      file_path: relativePath,
      file_url: fileUrl,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      notes: dto.notes,
    });
  }

  async findAll(
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ScanDocument[]> {
    const filter = await this.buildAccessFilter(currentUserId, currentUserRole);

    return this.scanModel
      .find(filter)
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('uploaded_by', 'full_name email')
      .exec();
  }

  async findMyScans(currentUserId: string): Promise<ScanDocument[]> {
    const patient = await this.patientsService.findByUserId(currentUserId);

    return this.scanModel
      .find({ patient: patient._id })
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('uploaded_by', 'full_name email')
      .exec();
  }

  async findByPatient(
    patientId: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ScanDocument[]> {
    if (currentUserRole !== UserRole.ADMIN) {
      await this.patientsService.findOne(patientId, currentUserId, currentUserRole);
    }

    return this.scanModel
      .find({ patient: patientId })
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('uploaded_by', 'full_name email')
      .exec();
  }

  async findOne(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ScanDocument> {
    const scan = await this.scanModel.findById(id).exec();
    if (!scan) throw new NotFoundException(`Scan "${id}" not found`);

    await this.ensureCanAccessScan(scan, currentUserId, currentUserRole);

    const populated = await this.scanModel
      .findById(id)
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('uploaded_by', 'full_name email')
      .exec();

    if (!populated) throw new NotFoundException(`Scan "${id}" not found`);
    return populated;
  }

  async update(
    id: string,
    dto: UpdateScanDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ScanDocument> {
    if (currentUserRole === UserRole.PATIENT) {
      throw new ForbiddenException('Patients cannot update scans');
    }

    await this.findOne(id, currentUserId, currentUserRole);

    const update: Partial<Scan> = {};
    if (dto.type) update.type = dto.type;
    if (dto.notes !== undefined) update.notes = dto.notes;

    if (dto.patient_id) {
      const patient =
        currentUserRole === UserRole.ADMIN
          ? await this.patientsService.findOne(dto.patient_id, currentUserId, currentUserRole)
          : await this.patientsService.findOne(dto.patient_id, currentUserId, UserRole.DOCTOR);
      update.patient = patient._id;
    }

    const updated = await this.scanModel
      .findByIdAndUpdate(id, update, { new: true })
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('uploaded_by', 'full_name email')
      .exec();

    if (!updated) throw new NotFoundException(`Scan "${id}" not found`);
    return updated;
  }

  async delete(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ScanDocument> {
    if (currentUserRole === UserRole.PATIENT) {
      throw new ForbiddenException('Patients cannot delete scans');
    }

    const scan = await this.scanModel.findById(id).exec();
    if (!scan) throw new NotFoundException(`Scan "${id}" not found`);

    await this.ensureCanAccessScan(scan, currentUserId, currentUserRole);

    const deleted = await this.scanModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`Scan "${id}" not found`);
    return deleted;
  }

  private async buildAccessFilter(currentUserId: string, currentUserRole: string) {
    if (currentUserRole === UserRole.ADMIN) return {};

    if (currentUserRole === UserRole.DOCTOR) {
      const patientIds = await this.patientsService.findIdsByDoctor(currentUserId);
      return { patient: { $in: patientIds } };
    }

    if (currentUserRole === UserRole.PATIENT) {
      const patient = await this.patientsService.findByUserId(currentUserId);
      return { patient: patient._id };
    }

    throw new ForbiddenException('Access denied to scans');
  }

  private async ensureCanAccessScan(
    scan: ScanDocument,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<void> {
    if (currentUserRole === UserRole.ADMIN) return;

    const patientId = scan.patient.toString();

    if (currentUserRole === UserRole.DOCTOR) {
      await this.patientsService.findOne(patientId, currentUserId, currentUserRole);
      return;
    }

    if (currentUserRole === UserRole.PATIENT) {
      const patient = await this.patientsService.findByUserId(currentUserId);
      if (patient._id.toString() === patientId) return;
    }

    throw new ForbiddenException('Access denied to this scan');
  }
}
