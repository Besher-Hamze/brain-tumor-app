import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DoctorsService } from './doctors.service';
import { PatientUsersService } from './patient-users.service';
import { UserDocument } from './schema/user.schema';
import { UsersService } from './users.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly doctorsService: DoctorsService,
    private readonly patientUsersService: PatientUsersService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<UserDocument> {
    return this.usersService.create(dto);
  }

  async findAllUsers(): Promise<UserDocument[]> {
    return this.usersService.findAll();
  }

  async findAllDoctors(): Promise<UserDocument[]> {
    return this.doctorsService.findAllDoctors();
  }

  async findAllPatients(): Promise<UserDocument[]> {
    return this.patientUsersService.findAllPatients();
  }

  async findUser(id: string): Promise<UserDocument> {
    return this.usersService.findOne(id);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    return this.usersService.update(id, dto);
  }

  async activateUser(id: string): Promise<UserDocument> {
    return this.usersService.activate(id);
  }

  async deactivateUser(id: string): Promise<UserDocument> {
    return this.usersService.deactivate(id);
  }
}
