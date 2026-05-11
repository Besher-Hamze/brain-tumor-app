import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationType } from 'src/common/enums/notification-type.enum';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  user_id!: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
