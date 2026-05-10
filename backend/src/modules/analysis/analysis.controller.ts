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
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { UpdateAnalysisDto } from './dto/update-analysis.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(private readonly analysisService: AnalysisService) {}

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Post()
  async create(
    @Body() dto: CreateAnalysisDto,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`POST /analysis -> scan: ${dto.scan_id}`);
    const analysis = await this.analysisService.create(dto, userId, role);
    return { success: true, analysis };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Post('scan/:scanId/run')
  async runForScan(
    @Param('scanId') scanId: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`POST /analysis/scan/${scanId}/run`);
    const analysis = await this.analysisService.runForScan(scanId, userId, role);
    return { success: analysis.status !== 'failed', analysis };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get()
  async findAll(
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /analysis -> ${role} ${userId}`);
    const analyses = await this.analysisService.findAll(userId, role);
    return { success: true, count: analyses.length, analyses };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get('scan/:scanId')
  async findByScan(
    @Param('scanId') scanId: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /analysis/scan/${scanId}`);
    const analysis = await this.analysisService.findByScan(scanId, userId, role);
    return { success: true, analysis };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /analysis/${id}`);
    const analysis = await this.analysisService.findOne(id, userId, role);
    return { success: true, analysis };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnalysisDto,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`PATCH /analysis/${id}`);
    const analysis = await this.analysisService.update(id, dto, userId, role);
    return { success: true, analysis };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`DELETE /analysis/${id}`);
    const analysis = await this.analysisService.delete(id, userId, role);
    return { success: true, analysis };
  }
}
