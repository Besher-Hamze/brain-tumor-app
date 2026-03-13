import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  old_password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  new_password: string;
}
