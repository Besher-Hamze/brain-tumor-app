import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/common/enums/role.enum';
import { UserDocument } from './schema/user.schema';
import { UsersService } from './users.service';

@Injectable()
export class PatientUsersService {
  constructor(private readonly usersService: UsersService) {}

  async findAllPatients(): Promise<UserDocument[]> {
    return this.usersService.findByRole(UserRole.PATIENT);
  }
}
