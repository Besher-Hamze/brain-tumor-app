import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from 'src/common/enums/role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  full_name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  hospital?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
