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
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateReportDto, @CurrentUser() user: any) {
    this.logger.log(`POST /reports -> scan: ${dto.scan_id}`);
    const report = await this.reportsService.create(
      dto,
      user._id.toString(),
      user.role,
    );
    return { success: true, report };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get()
  async findAll(@CurrentUser() user: any) {
    this.logger.log(`GET /reports -> ${user.role} ${user._id}`);
    const reports = await this.reportsService.findAll(
      user._id.toString(),
      user.role,
    );
    return { success: true, count: reports.length, reports };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get('patient/:patientId')
  async findByPatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`GET /reports/patient/${patientId}`);
    const reports = await this.reportsService.findByPatient(
      patientId,
      user._id.toString(),
      user.role,
    );
    return { success: true, count: reports.length, reports };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get('scan/:scanId')
  async findByScan(@Param('scanId') scanId: string, @CurrentUser() user: any) {
    this.logger.log(`GET /reports/scan/${scanId}`);
    const report = await this.reportsService.findByScan(
      scanId,
      user._id.toString(),
      user.role,
    );
    return { success: true, report };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`GET /reports/${id}`);
    const report = await this.reportsService.findOne(
      id,
      user._id.toString(),
      user.role,
    );
    return { success: true, report };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`PATCH /reports/${id}`);
    const report = await this.reportsService.update(
      id,
      dto,
      user._id.toString(),
      user.role,
    );
    return { success: true, report };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`DELETE /reports/${id}`);
    const report = await this.reportsService.delete(
      id,
      user._id.toString(),
      user.role,
    );
    return { success: true, report };
  }
}
