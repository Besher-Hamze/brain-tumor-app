import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  IsDateString,
} from 'class-validator';
import { Gender } from 'src/common/enums/gender.enum';
import { BloodType } from 'src/common/enums/blood-type.enum';

export class CreatePatientDto {
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsDateString()
  date_of_birth: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(BloodType)
  blood_type?: BloodType;

  @IsOptional()
  @IsString()
  notes?: string;
}
