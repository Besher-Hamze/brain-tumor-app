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
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  private readonly logger = new Logger(PatientsController.name);

  constructor(private readonly patientsService: PatientsService) {}

  @Roles(UserRole.DOCTOR)
  @Post()
  async create(@Body() dto: CreatePatientDto, @GetUserId() userId: string) {
    this.logger.log(`POST /patients -> doctor: ${userId}`);
    const patient = await this.patientsService.create(dto, userId);
    return { success: true, patient };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get()
  async findAll(
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /patients -> ${role} ${userId}`);
    const patients = await this.patientsService.findAll(userId, role);
    return { success: true, count: patients.length, patients };
  }

  @Roles(UserRole.ADMIN)
  @Get('count-by-doctor')
  async countByDoctor() {
    this.logger.log('GET /patients/count-by-doctor');
    const data = await this.patientsService.countByDoctor();
    return { success: true, data };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /patients/${id} -> ${role} ${userId}`);
    const patient = await this.patientsService.findOne(id, userId, role);
    return { success: true, patient };
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    this.logger.log(`PATCH /patients/${id}/activate`);
    const patient = await this.patientsService.activate(id);
    return { success: true, patient };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`PATCH /patients/${id} -> ${role} ${userId}`);
    const patient = await this.patientsService.update(id, dto, userId, role);
    return { success: true, patient };
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    this.logger.log(`DELETE /patients/${id}`);
    const patient = await this.patientsService.deactivate(id);
    return { success: true, patient };
  }
}
