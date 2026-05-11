import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosError } from 'axios';
import { createReadStream, existsSync } from 'fs';
import FormData from 'form-data';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import { AnalysisStatus } from 'src/common/enums/analysis-status.enum';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { UserRole } from 'src/common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { ScansService } from '../scans/scans.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { UpdateAnalysisDto } from './dto/update-analysis.dto';
import { Analysis, AnalysisDocument } from './schemas/analysis.schema';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectModel(Analysis.name)
    private analysisModel: Model<AnalysisDocument>,
    private readonly scansService: ScansService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    dto: CreateAnalysisDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AnalysisDocument> {
    await this.scansService.findOne(dto.scan_id, currentUserId, currentUserRole);

    const existing = await this.analysisModel
      .findOne({ scan: dto.scan_id })
      .exec();
    if (existing) throw new ConflictException('Analysis already exists for this scan');

    return this.analysisModel.create({
      scan: new Types.ObjectId(dto.scan_id),
      status: dto.status || AnalysisStatus.PENDING,
      prediction: dto.prediction,
      confidence: dto.confidence,
      error_message: dto.error_message,
      raw_result: dto.raw_result,
    });
  }

  async findAll(
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AnalysisDocument[]> {
    const filter = await this.buildAccessFilter(currentUserId, currentUserRole);

    return this.analysisModel
      .find(filter)
      .populate('scan')
      .exec();
  }

  async findByScan(
    scanId: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AnalysisDocument> {
    await this.scansService.findOne(scanId, currentUserId, currentUserRole);

    const analysis = await this.analysisModel
      .findOne({ scan: scanId })
      .populate('scan')
      .exec();

    if (!analysis) throw new NotFoundException(`Analysis for scan "${scanId}" not found`);
    return analysis;
  }

  async runForScan(
    scanId: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AnalysisDocument> {
    const scan = await this.scansService.findOne(
      scanId,
      currentUserId,
      currentUserRole,
    );

    let analysis = await this.analysisModel.findOne({ scan: scanId }).exec();
    if (!analysis) {
      analysis = await this.analysisModel.create({
        scan: new Types.ObjectId(scanId),
        status: AnalysisStatus.PENDING,
      });
    }

    analysis.status = AnalysisStatus.PROCESSING;
    analysis.error_message = undefined;
    await analysis.save();

    try {
      const result = await this.callFlaskAnalyze(scan.file_path, scan.type);
      const mapped = this.mapFlaskResult(result);

      analysis.status = AnalysisStatus.COMPLETED;
      analysis.prediction = mapped.prediction;
      analysis.confidence = mapped.confidence;
      analysis.raw_result = result;
      analysis.error_message = undefined;
      await analysis.save();

      await this.scansService.markAiResult(
        scanId,
        analysis._id.toString(),
        true,
      );
      await this.notifyAnalysisCompleted(scanId, analysis._id.toString());

      const populated = await this.analysisModel
        .findById(analysis._id)
        .populate('scan')
        .exec();

      if (!populated) throw new NotFoundException(`Analysis "${analysis._id}" not found`);
      return populated;
    } catch (error) {
      analysis.status = AnalysisStatus.FAILED;
      analysis.error_message = this.getErrorMessage(error);
      await analysis.save();
      await this.scansService.markAiResult(scanId, analysis._id.toString(), false);
      await this.notifyAnalysisFailed(
        scanId,
        analysis._id.toString(),
        analysis.error_message,
      );

      const populated = await this.analysisModel
        .findById(analysis._id)
        .populate('scan')
        .exec();

      if (!populated) throw new NotFoundException(`Analysis "${analysis._id}" not found`);
      return populated;
    }
  }

  async findOne(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AnalysisDocument> {
    const analysis = await this.analysisModel.findById(id).exec();
    if (!analysis) throw new NotFoundException(`Analysis "${id}" not found`);

    await this.scansService.findOne(
      analysis.scan.toString(),
      currentUserId,
      currentUserRole,
    );

    const populated = await this.analysisModel
      .findById(id)
      .populate('scan')
      .exec();

    if (!populated) throw new NotFoundException(`Analysis "${id}" not found`);
    return populated;
  }

  async update(
    id: string,
    dto: UpdateAnalysisDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AnalysisDocument> {
    await this.findOne(id, currentUserId, currentUserRole);

    const updated = await this.analysisModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('scan')
      .exec();

    if (!updated) throw new NotFoundException(`Analysis "${id}" not found`);
    return updated;
  }

  async delete(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AnalysisDocument> {
    await this.findOne(id, currentUserId, currentUserRole);

    const deleted = await this.analysisModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`Analysis "${id}" not found`);
    return deleted;
  }

  private async buildAccessFilter(
    currentUserId: string,
    currentUserRole: string,
  ) {
    if (currentUserRole === UserRole.ADMIN) return {};

    const scans = await this.scansService.findAll(currentUserId, currentUserRole);
    return { scan: { $in: scans.map((scan) => scan._id) } };
  }

  private async callFlaskAnalyze(
    scanFilePath: string,
    scanType: string,
  ): Promise<Record<string, unknown>> {
    const aiApiUrl = this.configService.get<string>('AI_API_URL') || 'http://localhost:5000';
    const filePath = join(process.cwd(), 'uploads', scanFilePath);

    if (!existsSync(filePath)) {
      throw new NotFoundException(`Scan file "${scanFilePath}" not found on server`);
    }

    const form = new FormData();
    form.append('file', createReadStream(filePath));
    form.append('scan_type', scanType);

    const response = await axios.post<Record<string, unknown>>(
      `${aiApiUrl}/analyze`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 120000,
      },
    );

    if (response.data.success === false) {
      throw new Error(String(response.data.error || 'AI analysis failed'));
    }

    return response.data;
  }

  private mapFlaskResult(result: Record<string, unknown>): {
    prediction: string;
    confidence: number;
  } {
    const detection = this.asRecord(result.detection);
    const classification = this.asRecord(result.classification);
    const hasTumor = detection.has_tumor === true;
    const tumorType = classification.tumor_type;
    const classificationConfidence = Number(classification.confidence || 0);
    const detectionConfidence = Number(detection.confidence || 0);

    return {
      prediction: hasTumor
        ? typeof tumorType === 'string' && tumorType.length > 0
          ? tumorType
          : 'Tumor detected'
        : 'No tumor detected',
      confidence: classificationConfidence || detectionConfidence,
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  }

  private getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      return (
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        axiosError.message
      );
    }

    if (error instanceof Error) return error.message;
    return 'AI analysis failed';
  }

  private async notifyAnalysisCompleted(
    scanId: string,
    analysisId: string,
  ): Promise<void> {
    const scan = await this.scansService.findOne(scanId, '', UserRole.ADMIN);
    const patient = this.asRecord(scan.patient);
    const patientUserId = this.extractObjectId(patient.user);
    const doctorUserId = this.extractObjectId(patient.doctor);

    const metadata = { scan_id: scanId, analysis_id: analysisId };

    if (doctorUserId) {
      await this.notificationsService.createForUser(
        doctorUserId,
        NotificationType.AI_RESULT_READY,
        'AI analysis is ready for a patient scan.',
        metadata,
      );
    }

    if (patientUserId) {
      await this.notificationsService.createForUser(
        patientUserId,
        NotificationType.AI_RESULT_READY,
        'Your scan AI analysis is ready.',
        metadata,
      );
    }
  }

  private async notifyAnalysisFailed(
    scanId: string,
    analysisId: string,
    errorMessage?: string,
  ): Promise<void> {
    const scan = await this.scansService.findOne(scanId, '', UserRole.ADMIN);
    const patient = this.asRecord(scan.patient);
    const doctorUserId = this.extractObjectId(patient.doctor);

    if (!doctorUserId) return;

    await this.notificationsService.createForUser(
      doctorUserId,
      NotificationType.AI_RESULT_FAILED,
      'AI analysis failed for a patient scan.',
      { scan_id: scanId, analysis_id: analysisId, error_message: errorMessage },
    );
  }

  private extractObjectId(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value instanceof Types.ObjectId) return value.toString();

    if (typeof value === 'object' && '_id' in value) {
      const id = (value as { _id?: unknown })._id;
      if (typeof id === 'string') return id;
      if (id instanceof Types.ObjectId) return id.toString();
      if (id && typeof id === 'object' && 'toString' in id) {
        return String(id);
      }
    }

    if (typeof value === 'object' && 'toString' in value) {
      return String(value);
    }

    return null;
  }
}
