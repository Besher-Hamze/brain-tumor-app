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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  // POST /api/users
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`POST /users → email: ${createUserDto.email}`);
    const user = await this.usersService.create(createUserDto);
    this.logger.log(`✅ User created: ${user.email}`);
    return { success: true, user };
  }

  // GET /api/users
  @Get()
  async findAll() {
    this.logger.log(`GET /users`);
    const users = await this.usersService.findAll();
    this.logger.log(`✅ Found ${users.length} users`);
    return { success: true, users };
  }

  // GET /api/users/doctors
  @Get('doctors')
  async findAllDoctors() {
    this.logger.log(`GET /users/doctors`);
    const doctors = await this.usersService.findAllDoctors();
    this.logger.log(`✅ Found ${doctors.length} doctors`);
    return { success: true, doctors };
  }

  // GET /api/users/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`GET /users/${id}`);
    const user = await this.usersService.findOne(id);
    this.logger.log(`✅ Found user: ${user.email}`);
    return { success: true, user };
  }

  // PATCH /api/users/:id
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    this.logger.log(`PATCH /users/${id}`);
    const user = await this.usersService.update(id, updateUserDto);
    this.logger.log(`✅ Updated user: ${id}`);
    return { success: true, user };
  }

  // PATCH /api/users/:id/activate
  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    this.logger.log(`PATCH /users/${id}/activate`);
    const user = await this.usersService.activate(id);
    this.logger.log(`✅ Activated user: ${id}`);
    return { success: true, user };
  }

  // DELETE /api/users/:id
  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    this.logger.log(`DELETE /users/${id}`);
    const user = await this.usersService.deactivate(id);
    this.logger.log(`✅ Deactivated user: ${id}`);
    return { success: true, user };
  }
}
