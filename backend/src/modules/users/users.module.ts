import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { DoctorsService } from './doctors.service';
import { PatientUsersService } from './patient-users.service';
import { User, UserSchema } from './schema/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    AdminService,
    DoctorsService,
    PatientUsersService,
  ],
  exports: [UsersService, DoctorsService, PatientUsersService],
})
export class UsersModule {}
