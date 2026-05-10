import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  IsDateString,
  MinLength,
} from 'class-validator';
import { Gender } from 'src/common/enums/gender.enum';
import { BloodType } from 'src/common/enums/blood-type.enum';

export class CreatePatientDto {
  @IsNotEmpty()
  @IsString()
  full_name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @IsNotEmpty()
  @IsDateString()
  date_of_birth!: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender!: Gender;

  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsOptional()
  @IsEnum(BloodType)
  blood_type?: BloodType;

  @IsOptional()
  @IsString()
  notes?: string;
}
