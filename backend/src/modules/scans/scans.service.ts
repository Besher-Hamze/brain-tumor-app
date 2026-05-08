import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Scan, ScanDocument } from './schemas/scan.schema';
import { CreateScanDto } from './dto/create-scan.dto';
import { UpdateScanDto } from './dto/update-scan.dto';
import { UserRole } from 'src/common/enums/role.enum';

@Injectable()
export class ScansService {
  constructor(
    @InjectModel(Scan.name) private scanModel: Model<ScanDocument>,
  ) {}

  async create(
    dto: CreateScanDto,
    file: Express.Multer.File,
    currentUserId: string,
  ): Promise<ScanDocument> {
    if (!file) {
      throw new NotFoundException('File is required');
    }

    const relativePath = `scans/${file.filename}`;
    const fileUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${relativePath}`;

    return this.scanModel.create({
      patient: new Types.ObjectId(dto.patient_id),
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

  async findAll(currentUserId: string, currentUserRole: string): Promise<ScanDocument[]> {
    const filter =
      currentUserRole === UserRole.ADMIN ? {} : { uploaded_by: currentUserId };

    return this.scanModel
      .find(filter)
      .populate('patient', 'full_name medical_record_number')
      .populate('uploaded_by', 'full_name email')
      .exec();
  }

  async findByPatient(
    patientId: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ScanDocument[]> {
    const filter =
      currentUserRole === UserRole.ADMIN
        ? { patient: patientId }
        : { patient: patientId, uploaded_by: currentUserId };

    return this.scanModel
      .find(filter)
      .populate('patient', 'full_name medical_record_number')
      .populate('uploaded_by', 'full_name email')
      .exec();
  }

  async findOne(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ScanDocument> {
    const scan = await this.scanModel
      .findById(id)
      .populate('patient', 'full_name medical_record_number')
      .populate('uploaded_by', 'full_name email')
      .exec();

    if (!scan) throw new NotFoundException(`Scan "${id}" not found`);

    if (
      currentUserRole !== UserRole.ADMIN &&
      scan.uploaded_by.toString() !== currentUserId
    ) {
      throw new ForbiddenException('Access denied to this scan');
    }

    return scan;
  }

  async update(
    id: string,
    dto: UpdateScanDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ScanDocument> {
    await this.findOne(id, currentUserId, currentUserRole);

    const updated = await this.scanModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('patient', 'full_name medical_record_number')
      .populate('uploaded_by', 'full_name email')
      .exec();

    if (!updated) throw new NotFoundException(`Scan "${id}" not found`);
    return updated;
  }

  async delete(id: string, currentUserId: string, currentUserRole: string): Promise<ScanDocument> {
  const scan = await this.scanModel.findById(id).exec();
  if (!scan) throw new NotFoundException(`Scan "${id}" not found`);

  if (
    currentUserRole !== UserRole.ADMIN &&
    scan.uploaded_by.toString() !== currentUserId
  ) {
    throw new ForbiddenException('Access denied to this scan');
  }

  const deleted = await this.scanModel.findByIdAndDelete(id).exec();
  if (!deleted) throw new NotFoundException(`Scan "${id}" not found`);
  return deleted;
}

}
