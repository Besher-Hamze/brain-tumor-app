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
import { CurrentUser, Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { scanMulterOptions } from 'src/config/multer.config';
import { CreateScanDto } from './dto/create-scan.dto';
import { UpdateScanDto } from './dto/update-scan.dto';
import { ScansService } from './scans.service';

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
    @CurrentUser() user: any,
  ) {
    this.logger.log(`POST /scans -> by: ${user._id}`);
    const scan = await this.scansService.create(
      dto,
      file,
      user._id.toString(),
      user.role,
    );
    return { success: true, scan };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get()
  async findAll(@CurrentUser() user: any) {
    this.logger.log(`GET /scans -> ${user.role} ${user._id}`);
    const scans = await this.scansService.findAll(user._id.toString(), user.role);
    return { success: true, count: scans.length, scans };
  }

  @Roles(UserRole.PATIENT)
  @Get('my')
  async findMyScans(@CurrentUser() user: any) {
    this.logger.log(`GET /scans/my -> ${user._id}`);
    const scans = await this.scansService.findMyScans(user._id.toString());
    return { success: true, count: scans.length, scans };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get('patient/:patientId')
  async findByPatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`GET /scans/patient/${patientId}`);
    const scans = await this.scansService.findByPatient(
      patientId,
      user._id.toString(),
      user.role,
    );
    return { success: true, count: scans.length, scans };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`GET /scans/${id}`);
    const scan = await this.scansService.findOne(id, user._id.toString(), user.role);
    return { success: true, scan };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScanDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`PATCH /scans/${id}`);
    const scan = await this.scansService.update(id, dto, user._id.toString(), user.role);
    return { success: true, scan };
  }

  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`DELETE /scans/${id}`);
    const scan = await this.scansService.delete(id, user._id.toString(), user.role);
    return { success: true, scan };
  }
}
