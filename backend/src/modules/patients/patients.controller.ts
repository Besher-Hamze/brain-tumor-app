// src/modules/patients/patients.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CurrentUser, Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  private readonly logger = new Logger(PatientsController.name);

  constructor(private readonly patientsService: PatientsService) {}

  // 1) Create patient
  // Scenario: Doctor (or Admin) adds a new patient.
  // doctor field = current logged-in user.
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreatePatientDto, @CurrentUser() user: any) {
    this.logger.log(`POST /patients → by: ${user._id} (${user.role})`);
    const patient = await this.patientsService.create(dto, user._id.toString());
    return { success: true, patient };
  }

  // 2) List patients
  // Scenario:
  // - Doctor → only see their own patients.
  // - Admin → see all patients.
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get()
  async findAll(@CurrentUser() user: any) {
    this.logger.log(`GET /patients → ${user.role} ${user._id}`);
    const patients = await this.patientsService.findAll(
      user._id.toString(),
      user.role,
    );
    return { success: true, count: patients.length, patients };
  }

  // 3) Admin dashboard: count patients per doctor
  // Scenario: Admin wants stats (/dashboard).
  @Roles(UserRole.ADMIN)
  @Get('count-by-doctor')
  async countByDoctor() {
    this.logger.log(`GET /patients/count-by-doctor`);
    const data = await this.patientsService.countByDoctor();
    return { success: true, data };
  }

  // 4) Get one patient
  // Scenario:
  // - Doctor: can open only patients they own.
  // - Admin: can open any.
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`GET /patients/${id} → ${user.role} ${user._id}`);
    const patient = await this.patientsService.findOne(
      id,
      user._id.toString(),
      user.role,
    );
    return { success: true, patient };
  }

  // 5) Update patient
  // Scenario:
  // - Doctor: can edit their own patients only.
  // - Admin: can edit anyone.
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`PATCH /patients/${id} → ${user.role} ${user._id}`);
    const patient = await this.patientsService.update(
      id,
      dto,
      user._id.toString(),
      user.role,
    );
    return { success: true, patient };
  }

  // 6) Activate patient (Admin only)
  // Scenario: Admin reactivates a previously deactivated patient.
  @Roles(UserRole.ADMIN)
  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    this.logger.log(`PATCH /patients/${id}/activate`);
    const patient = await this.patientsService.activate(id);
    return { success: true, patient };
  }

  // 7) Deactivate patient (Admin only)
  // Scenario: Admin soft-deletes a patient (is_active = false).
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    this.logger.log(`DELETE /patients/${id}`);
    const patient = await this.patientsService.deactivate(id);
    return { success: true, patient };
  }
}
