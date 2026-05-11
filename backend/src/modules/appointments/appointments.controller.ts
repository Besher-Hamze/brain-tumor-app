import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUserId, GetUserRole, Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Post()
  async create(
    @Body() dto: CreateAppointmentDto,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`POST /appointments -> patient: ${dto.patient_id}`);
    const appointment = await this.appointmentsService.create(dto, userId, role);
    return { success: true, appointment };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get()
  async findAll(
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /appointments -> ${role} ${userId}`);
    const appointments = await this.appointmentsService.findAll(userId, role);
    return { success: true, count: appointments.length, appointments };
  }

  @Roles(UserRole.PATIENT)
  @Get('my')
  async findMyAppointments(@GetUserId() userId: string) {
    this.logger.log(`GET /appointments/my -> ${userId}`);
    const appointments = await this.appointmentsService.findMyAppointments(userId);
    return { success: true, count: appointments.length, appointments };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get('patient/:patientId')
  async findByPatient(
    @Param('patientId') patientId: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /appointments/patient/${patientId}`);
    const appointments = await this.appointmentsService.findByPatient(
      patientId,
      userId,
      role,
    );
    return { success: true, count: appointments.length, appointments };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /appointments/${id}`);
    const appointment = await this.appointmentsService.findOne(id, userId, role);
    return { success: true, appointment };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`PATCH /appointments/${id}/cancel`);
    const appointment = await this.appointmentsService.cancel(id, userId, role);
    return { success: true, appointment };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`PATCH /appointments/${id}`);
    const appointment = await this.appointmentsService.update(
      id,
      dto,
      userId,
      role,
    );
    return { success: true, appointment };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`DELETE /appointments/${id}`);
    const appointment = await this.appointmentsService.delete(id, userId, role);
    return { success: true, appointment };
  }
}
