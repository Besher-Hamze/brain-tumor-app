import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './schemas/patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UserRole } from 'src/common/enums/role.enum';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
  ) {}

  // ── CREATE ─────────────────────────────────────────
  async create(
    dto: CreatePatientDto,
    doctorId: string,
  ): Promise<PatientDocument> {
    return this.patientModel.create({ ...dto, doctor: doctorId });
  }

  // ── FIND ALL ───────────────────────────────────────
  async findAll(userId: string, role: string): Promise<PatientDocument[]> {
    const filter = role === UserRole.ADMIN ? {} : { doctor: userId };
    return this.patientModel
      .find(filter)
      .populate('doctor', 'full_name email specialty')
      .exec();
  }

  // ── FIND ONE ───────────────────────────────────────
  async findOne(id: string, userId: string, role: string): Promise<PatientDocument> {
    const patient = await this.patientModel
      .findById(id)
      .populate('doctor', 'full_name email specialty')
      .exec();

    if (!patient) throw new NotFoundException(`Patient "${id}" not found`);

    if (role !== UserRole.ADMIN && patient.doctor.toString() !== userId) {
      throw new ForbiddenException('Access denied to this patient');
    }

    return patient;
  }

  // ── UPDATE ─────────────────────────────────────────
  async update(id: string, dto: UpdatePatientDto, userId: string, role: string): Promise<PatientDocument> {
    await this.findOne(id, userId, role); // ownership check

    const updated = await this.patientModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('doctor', 'full_name email specialty')
      .exec();

    if (!updated) throw new NotFoundException(`Patient "${id}" not found`);
    return updated;
  }

  // ── DEACTIVATE (Admin only) ────────────────────────
  async deactivate(id: string): Promise<PatientDocument> {
    const patient = await this.patientModel
      .findByIdAndUpdate(id, { is_active: false }, { new: true })
      .exec();
    if (!patient) throw new NotFoundException(`Patient "${id}" not found`);
    return patient;
  }

  // ── ACTIVATE (Admin only) ──────────────────────────
  async activate(id: string): Promise<PatientDocument> {
    const patient = await this.patientModel
      .findByIdAndUpdate(id, { is_active: true }, { new: true })
      .exec();
    if (!patient) throw new NotFoundException(`Patient "${id}" not found`);
    return patient;
  }

  // ── COUNT BY DOCTOR ────────────────────────────────
  async countByDoctor(): Promise<any[]> {
    return this.patientModel.aggregate([
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: '$doctor' },
      {
        $project: {
          count: 1,
          'doctor._id': 1,
          'doctor.full_name': 1,
          'doctor.email': 1,
          'doctor.specialty': 1,
        },
      },
    ]);
  }
}
