import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUserId, GetUserRole, Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { scanMulterOptions } from 'src/config/multer.config';
import { CreateScanDto } from './dto/create-scan.dto';
import { ScansService } from './scans.service';
import { UpdateScanDto } from './dto/update-scan.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scans')
export class ScansController {
  private readonly logger = new Logger(ScansController.name);

  constructor(private readonly scansService: ScansService) {}

  @Roles(UserRole.DOCTOR)
  @Post()
  @UseInterceptors(FileInterceptor('file', scanMulterOptions))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateScanDto,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`POST /scans -> doctor: ${userId}`);
    const scan = await this.scansService.create(dto, file, userId, role);
    return { success: true, scan };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get()
  async findAll(
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /scans -> ${role} ${userId}`);
    const scans = await this.scansService.findAll(userId, role);
    return { success: true, count: scans.length, scans };
  }

  @Roles(UserRole.PATIENT)
  @Get('my')
  async findMyScans(@GetUserId() userId: string) {
    this.logger.log(`GET /scans/my -> ${userId}`);
    const scans = await this.scansService.findMyScans(userId);
    return { success: true, count: scans.length, scans };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get('patient/:patientId')
  async findByPatient(
    @Param('patientId') patientId: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /scans/patient/${patientId}`);
    const scans = await this.scansService.findByPatient(patientId, userId, role);
    return { success: true, count: scans.length, scans };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /scans/${id}`);
    const scan = await this.scansService.findOne(id, userId, role);
    return { success: true, scan };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScanDto,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`PATCH /scans/${id}`);
    const scan = await this.scansService.update(id, dto, userId, role);
    return { success: true, scan };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`DELETE /scans/${id}`);
    const scan = await this.scansService.delete(id, userId, role);
    return { success: true, scan };
  }
}
