import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AppointmentStatus } from 'src/common/enums/appointment-status.enum';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  patient_id!: string;

  @IsNotEmpty()
  @IsDateString()
  date_time!: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
