import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/common/enums/role.enum';
import { UserDocument } from './schema/user.schema';
import { UsersService } from './users.service';

@Injectable()
export class DoctorsService {
  constructor(private readonly usersService: UsersService) {}

  async findAllDoctors(): Promise<UserDocument[]> {
    return this.usersService.findByRole(UserRole.DOCTOR);
  }
}
