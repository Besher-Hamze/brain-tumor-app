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
import { Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly adminService: AdminService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`POST /users -> email: ${createUserDto.email}`);
    const user = await this.adminService.createUser(createUserDto);
    return { success: true, user };
  }

  @Get()
  async findAll() {
    this.logger.log('GET /users');
    const users = await this.adminService.findAllUsers();
    return { success: true, users };
  }

  @Get('doctors')
  async findAllDoctors() {
    this.logger.log('GET /users/doctors');
    const doctors = await this.adminService.findAllDoctors();
    return { success: true, doctors };
  }

  @Get('patients')
  async findAllPatients() {
    this.logger.log('GET /users/patients');
    const patients = await this.adminService.findAllPatients();
    return { success: true, patients };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`GET /users/${id}`);
    const user = await this.adminService.findUser(id);
    return { success: true, user };
  }

  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    this.logger.log(`PATCH /users/${id}/activate`);
    const user = await this.adminService.activateUser(id);
    return { success: true, user };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    this.logger.log(`PATCH /users/${id}`);
    const user = await this.adminService.updateUser(id, updateUserDto);
    return { success: true, user };
  }

  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    this.logger.log(`DELETE /users/${id}`);
    const user = await this.adminService.deactivateUser(id);
    return { success: true, user };
  }
}
