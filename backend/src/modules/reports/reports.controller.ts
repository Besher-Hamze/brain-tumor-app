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
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';
import { UpdateReportDto } from './dto/update-report.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Post()
  async create(
    @Body() dto: CreateReportDto,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`POST /reports -> scan: ${dto.scan_id}`);
    const report = await this.reportsService.create(dto, userId, role);
    return { success: true, report };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get()
  async findAll(
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /reports -> ${role} ${userId}`);
    const reports = await this.reportsService.findAll(userId, role);
    return { success: true, count: reports.length, reports };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get('patient/:patientId')
  async findByPatient(
    @Param('patientId') patientId: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /reports/patient/${patientId}`);
    const reports = await this.reportsService.findByPatient(
      patientId,
      userId,
      role,
    );
    return { success: true, count: reports.length, reports };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get('scan/:scanId')
  async findByScan(
    @Param('scanId') scanId: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /reports/scan/${scanId}`);
    const report = await this.reportsService.findByScan(scanId, userId, role);
    return { success: true, report };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /reports/${id}`);
    const report = await this.reportsService.findOne(id, userId, role);
    return { success: true, report };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`PATCH /reports/${id}`);
    const report = await this.reportsService.update(id, dto, userId, role);
    return { success: true, report };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`DELETE /reports/${id}`);
    const report = await this.reportsService.delete(id, userId, role);
    return { success: true, report };
  }
}
