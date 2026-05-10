import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { AppointmentStatus } from 'src/common/enums/appointment-status.enum';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  date_time?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
