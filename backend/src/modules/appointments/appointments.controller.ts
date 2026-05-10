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
import { CurrentUser, Roles } from 'src/common/decorators';
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
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: any) {
    this.logger.log(`POST /appointments -> patient: ${dto.patient_id}`);
    const appointment = await this.appointmentsService.create(
      dto,
      user._id.toString(),
      user.role,
    );
    return { success: true, appointment };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get()
  async findAll(@CurrentUser() user: any) {
    this.logger.log(`GET /appointments -> ${user.role} ${user._id}`);
    const appointments = await this.appointmentsService.findAll(
      user._id.toString(),
      user.role,
    );
    return { success: true, count: appointments.length, appointments };
  }

  @Roles(UserRole.PATIENT)
  @Get('my')
  async findMyAppointments(@CurrentUser() user: any) {
    this.logger.log(`GET /appointments/my -> ${user._id}`);
    const appointments = await this.appointmentsService.findMyAppointments(
      user._id.toString(),
    );
    return { success: true, count: appointments.length, appointments };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get('patient/:patientId')
  async findByPatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`GET /appointments/patient/${patientId}`);
    const appointments = await this.appointmentsService.findByPatient(
      patientId,
      user._id.toString(),
      user.role,
    );
    return { success: true, count: appointments.length, appointments };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`GET /appointments/${id}`);
    const appointment = await this.appointmentsService.findOne(
      id,
      user._id.toString(),
      user.role,
    );
    return { success: true, appointment };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`PATCH /appointments/${id}/cancel`);
    const appointment = await this.appointmentsService.cancel(
      id,
      user._id.toString(),
      user.role,
    );
    return { success: true, appointment };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`PATCH /appointments/${id}`);
    const appointment = await this.appointmentsService.update(
      id,
      dto,
      user._id.toString(),
      user.role,
    );
    return { success: true, appointment };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`DELETE /appointments/${id}`);
    const appointment = await this.appointmentsService.delete(
      id,
      user._id.toString(),
      user.role,
    );
    return { success: true, appointment };
  }
}
