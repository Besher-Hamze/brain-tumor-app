// src/modules/patients/patients.service.ts
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

  // Doctor/Admin creates patient, doctor = current user
  async create(dto: CreatePatientDto, currentUserId: string): Promise<PatientDocument> {
    return this.patientModel.create({
      ...dto,
      doctor: currentUserId,
    });
  }

  // Admin → all, Doctor → own
  async findAll(currentUserId: string, currentUserRole: string): Promise<PatientDocument[]> {
    const filter =
      currentUserRole === UserRole.ADMIN ? {} : { doctor: currentUserId };

    return this.patientModel
      .find(filter)
      .populate('doctor', 'full_name email specialty')
      .exec();
  }

  async findOne(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<PatientDocument> {
    const patient = await this.patientModel
      .findById(id)
      .populate('doctor', 'full_name email specialty')
      .exec();

    if (!patient) throw new NotFoundException(`Patient "${id}" not found`);

    if (
      currentUserRole !== UserRole.ADMIN &&
      patient.doctor.toString() !== currentUserId
    ) {
      throw new ForbiddenException('Access denied to this patient');
    }

    return patient;
  }

  async update(
    id: string,
    dto: UpdatePatientDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<PatientDocument> {
    await this.findOne(id, currentUserId, currentUserRole);

    const updated = await this.patientModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('doctor', 'full_name email specialty')
      .exec();

    if (!updated) throw new NotFoundException(`Patient "${id}" not found`);
    return updated;
  }

  // Admin only – no need for currentUserId, we already guard in controller
  async deactivate(id: string): Promise<PatientDocument> {
    const patient = await this.patientModel
      .findByIdAndUpdate(id, { is_active: false }, { new: true })
      .exec();
    if (!patient) throw new NotFoundException(`Patient "${id}" not found`);
    return patient;
  }

  async activate(id: string): Promise<PatientDocument> {
    const patient = await this.patientModel
      .findByIdAndUpdate(id, { is_active: true }, { new: true })
      .exec();
    if (!patient) throw new NotFoundException(`Patient "${id}" not found`);
    return patient;
  }

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
