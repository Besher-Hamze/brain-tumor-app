// src/modules/patients/patients.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Patient, PatientDocument } from './schemas/patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UserRole } from 'src/common/enums/role.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    private readonly usersService: UsersService,
  ) {}

  // Doctor creates patient profile and linked patient account.
  async create(dto: CreatePatientDto, currentUserId: string): Promise<PatientDocument> {
    const { password, ...patientDto } = dto;
    const user = await this.usersService.create({
      full_name: dto.full_name,
      email: dto.email,
      password,
      phone: dto.phone,
      role: UserRole.PATIENT,
    });

    return this.patientModel.create({
      ...patientDto,
      user: user._id,
      doctor: new Types.ObjectId(currentUserId),
    });
  }

  // Admin → all, Doctor → own
  async findAll(currentUserId: string, currentUserRole: string): Promise<PatientDocument[]> {
    const filter =
      currentUserRole === UserRole.ADMIN
        ? {}
        : { doctor: this.toObjectId(currentUserId) };

    return this.patientModel
      .find(filter)
      .populate('user', 'full_name email phone is_active')
      .populate('doctor', 'full_name email specialty')
      .exec();
  }

  async findByUserId(userId: string): Promise<PatientDocument> {
    const patient = await this.patientModel
      .findOne({ user: this.toObjectId(userId) })
      .populate('user', 'full_name email phone is_active')
      .populate('doctor', 'full_name email specialty')
      .exec();

    if (!patient) throw new NotFoundException(`Patient profile for user "${userId}" not found`);
    return patient;
  }

  async findIdsByDoctor(doctorId: string): Promise<string[]> {
    const patients = await this.patientModel
      .find({ doctor: this.toObjectId(doctorId) })
      .select('_id')
      .exec();

    return patients.map((patient) => patient._id.toString());
  }

  async findOne(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<PatientDocument> {
    const patient = await this.patientModel
      .findById(id)
      .populate('user', 'full_name email phone is_active')
      .populate('doctor', 'full_name email specialty')
      .exec();

    if (!patient) throw new NotFoundException(`Patient "${id}" not found`);

    if (
      currentUserRole !== UserRole.ADMIN &&
      this.extractObjectId(patient.doctor) !== currentUserId
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
      .populate('user', 'full_name email phone is_active')
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

  private extractObjectId(value: unknown): string {
    if (typeof value === 'string') return value;

    if (value && typeof value === 'object' && '_id' in value) {
      return String((value as { _id: unknown })._id);
    }

    return String(value);
  }

  private toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }
}
