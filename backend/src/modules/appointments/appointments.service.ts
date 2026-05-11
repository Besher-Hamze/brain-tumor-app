import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppointmentStatus } from 'src/common/enums/appointment-status.enum';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { UserRole } from 'src/common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { PatientsService } from '../patients/patients.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  Appointment,
  AppointmentDocument,
} from './schemas/appointment.schema';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly patientsService: PatientsService,
  ) {}

  async create(
    dto: CreateAppointmentDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AppointmentDocument> {
    if (currentUserRole !== UserRole.DOCTOR && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only doctors and admins can create appointments');
    }

    const patient = await this.patientsService.findOne(
      dto.patient_id,
      currentUserId,
      currentUserRole,
    );

    const appointment = await this.appointmentModel.create({
      patient: patient._id,
      doctor:
        currentUserRole === UserRole.ADMIN
          ? patient.doctor
          : new Types.ObjectId(currentUserId),
      date_time: new Date(dto.date_time),
      status: dto.status || AppointmentStatus.SCHEDULED,
      notes: dto.notes,
    });

    await this.notifyPatient(
      this.extractObjectId(patient.user),
      'A new appointment has been scheduled.',
      appointment._id.toString(),
    );

    return this.populateAppointment(appointment._id.toString());
  }

  async findAll(
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AppointmentDocument[]> {
    const filter = await this.buildAccessFilter(currentUserId, currentUserRole);

    return this.appointmentModel
      .find(filter)
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('doctor', 'full_name email specialty')
      .sort({ date_time: 1 })
      .exec();
  }

  async findMyAppointments(currentUserId: string): Promise<AppointmentDocument[]> {
    const patient = await this.patientsService.findByUserId(currentUserId);

    return this.appointmentModel
      .find({ patient: patient._id })
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('doctor', 'full_name email specialty')
      .sort({ date_time: 1 })
      .exec();
  }

  async findByPatient(
    patientId: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AppointmentDocument[]> {
    if (currentUserRole !== UserRole.ADMIN) {
      await this.patientsService.findOne(patientId, currentUserId, currentUserRole);
    }

    return this.appointmentModel
      .find({ patient: patientId })
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('doctor', 'full_name email specialty')
      .sort({ date_time: 1 })
      .exec();
  }

  async findOne(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AppointmentDocument> {
    const appointment = await this.appointmentModel.findById(id).exec();
    if (!appointment) throw new NotFoundException(`Appointment "${id}" not found`);

    await this.ensureCanAccessAppointment(
      appointment,
      currentUserId,
      currentUserRole,
    );

    return this.populateAppointment(id);
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AppointmentDocument> {
    if (currentUserRole === UserRole.PATIENT) {
      throw new ForbiddenException('Patients cannot update appointments');
    }

    const current = await this.findOne(id, currentUserId, currentUserRole);

    const update: Partial<Appointment> = {};
    if (dto.date_time) update.date_time = new Date(dto.date_time);
    if (dto.status) update.status = dto.status;
    if (dto.notes !== undefined) update.notes = dto.notes;

    const updated = await this.appointmentModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();

    if (!updated) throw new NotFoundException(`Appointment "${id}" not found`);

    const patient = await this.patientsService.findOne(
      this.extractObjectId(current.patient),
      currentUserId,
      currentUserRole,
    );

    const message =
      dto.status === AppointmentStatus.CANCELLED
        ? 'Your appointment has been cancelled.'
        : 'Your appointment has been updated.';

    await this.notifyPatient(this.extractObjectId(patient.user), message, id);

    return this.populateAppointment(id);
  }

  async cancel(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AppointmentDocument> {
    return this.update(
      id,
      { status: AppointmentStatus.CANCELLED },
      currentUserId,
      currentUserRole,
    );
  }

  async delete(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AppointmentDocument> {
    if (currentUserRole === UserRole.PATIENT) {
      throw new ForbiddenException('Patients cannot delete appointments');
    }

    await this.findOne(id, currentUserId, currentUserRole);

    const deleted = await this.appointmentModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`Appointment "${id}" not found`);
    return deleted;
  }

  private async buildAccessFilter(
    currentUserId: string,
    currentUserRole: string,
  ) {
    if (currentUserRole === UserRole.ADMIN) return {};

    if (currentUserRole === UserRole.DOCTOR) {
      return { doctor: currentUserId };
    }

    if (currentUserRole === UserRole.PATIENT) {
      const patient = await this.patientsService.findByUserId(currentUserId);
      return { patient: patient._id };
    }

    throw new ForbiddenException('Access denied to appointments');
  }

  private async ensureCanAccessAppointment(
    appointment: AppointmentDocument,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<void> {
    if (currentUserRole === UserRole.ADMIN) return;

    if (
      currentUserRole === UserRole.DOCTOR &&
      appointment.doctor.toString() === currentUserId
    ) {
      return;
    }

    if (currentUserRole === UserRole.PATIENT) {
      const patient = await this.patientsService.findByUserId(currentUserId);
      if (patient._id.toString() === appointment.patient.toString()) return;
    }

    throw new ForbiddenException('Access denied to this appointment');
  }

  private async notifyPatient(
    patientUserId: string,
    message: string,
    appointmentId: string,
  ): Promise<void> {
    await this.notificationsService.createForUser(
      patientUserId,
      NotificationType.APPOINTMENT,
      message,
      { appointment_id: appointmentId },
    );
  }

  private async populateAppointment(id: string): Promise<AppointmentDocument> {
    const appointment = await this.appointmentModel
      .findById(id)
      .populate('patient', 'full_name medical_record_number user doctor')
      .populate('doctor', 'full_name email specialty')
      .exec();

    if (!appointment) throw new NotFoundException(`Appointment "${id}" not found`);
    return appointment;
  }

  private extractObjectId(value: unknown): string {
    if (value instanceof Types.ObjectId) return value.toString();
    if (typeof value === 'string') return value;

    if (value && typeof value === 'object' && '_id' in value) {
      const id = (value as { _id: Types.ObjectId | string })._id;
      return id.toString();
    }

    return String(value);
  }
}
