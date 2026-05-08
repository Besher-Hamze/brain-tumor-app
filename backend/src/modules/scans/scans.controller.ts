import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { ScansService } from './scans.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { UpdateScanDto } from './dto/update-scan.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CurrentUser, Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/enums/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { scanMulterOptions } from 'src/config/multer.config';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scans')
export class ScansController {
  private readonly logger = new Logger(ScansController.name);

  constructor(private readonly scansService: ScansService) {}

  // POST /api/scans
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('file', scanMulterOptions))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateScanDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`POST /scans → by: ${user._id}`);
    const scan = await this.scansService.create(dto, file, user._id.toString());
    this.logger.log(`✅ Scan uploaded: ${scan._id}`);
    return { success: true, scan };
  }

  // GET /api/scans
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get()
  async findAll(@CurrentUser() user: any) {
    this.logger.log(`GET /scans → ${user.role} ${user._id}`);
    const scans = await this.scansService.findAll(user._id.toString(), user.role);
    return { success: true, count: scans.length, scans };
  }

  // GET /api/scans/patient/:patientId
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string, @CurrentUser() user: any) {
    this.logger.log(`GET /scans/patient/${patientId}`);
    const scans = await this.scansService.findByPatient(
      patientId,
      user._id.toString(),
      user.role,
    );
    return { success: true, count: scans.length, scans };
  }

  // GET /api/scans/:id
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`GET /scans/${id}`);
    const scan = await this.scansService.findOne(id, user._id.toString(), user.role);
    return { success: true, scan };
  }

  // PATCH /api/scans/:id
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

  // DELETE /api/scans/:id
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`DELETE /scans/${id}`);
    const scan = await this.scansService.delete(id, user._id.toString(), user.role);
    return { success: true, scan };
  }
}
