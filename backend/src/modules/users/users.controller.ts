import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST /api/users
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return { success: true, user };
  }

  // GET /api/users
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return { success: true, users };
  }

  // GET /api/users/doctors
  @Get('doctors')
  async findAllDoctors() {
    const doctors = await this.usersService.findAllDoctors();
    return { success: true, doctors };
  }

  // GET /api/users/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return { success: true, user };
  }

  // PATCH /api/users/:id
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return { success: true, user };
  }

  // DELETE /api/users/:id
  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    const user = await this.usersService.deactivate(id);
    return { success: true, user };
  }
}
