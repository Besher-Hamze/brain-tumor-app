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

  // POST /api/patients ← Doctor + Admin
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreatePatientDto, @CurrentUser() user: any) {
    this.logger.log(`POST /patients → doctor: ${user._id}`);
    const patient = await this.patientsService.create(dto, user._id.toString());
    return { success: true, patient };
  }

  // GET /api/patients ← Doctor (own) | Admin (all)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get()
  async findAll(@CurrentUser() user: any) {
    this.logger.log(`GET /patients → ${user.role}: ${user._id}`);
    const patients = await this.patientsService.findAll(user._id.toString(), user.role);
    return { success: true, count: patients.length, patients };
  }

  // GET /api/patients/count-by-doctor ← Admin only
  @Roles(UserRole.ADMIN)
  @Get('count-by-doctor')
  async countByDoctor() {
    this.logger.log(`GET /patients/count-by-doctor`);
    const data = await this.patientsService.countByDoctor();
    return { success: true, data };
  }

  // GET /api/patients/:id ← Doctor (own) | Admin
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`GET /patients/${id}`);
    const patient = await this.patientsService.findOne(id, user._id.toString(), user.role);
    return { success: true, patient };
  }

  // PATCH /api/patients/:id ← Doctor (own) | Admin
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`PATCH /patients/${id}`);
    const patient = await this.patientsService.update(id, dto, user._id.toString(), user.role);
    return { success: true, patient };
  }

  // PATCH /api/patients/:id/activate ← Admin only
  @Roles(UserRole.ADMIN)
  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    this.logger.log(`PATCH /patients/${id}/activate`);
    const patient = await this.patientsService.activate(id);
    return { success: true, patient };
  }

  // DELETE /api/patients/:id ← Admin only
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    this.logger.log(`DELETE /patients/${id}`);
    const patient = await this.patientsService.deactivate(id);
    return { success: true, patient };
  }
}
