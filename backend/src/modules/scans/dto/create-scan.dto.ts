import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ScanType } from 'src/common/enums/scan-type.enum';

export class CreateScanDto {
  @IsNotEmpty()
  @IsString()
  patient_id: string;

  @IsNotEmpty()
  @IsEnum(ScanType)
  type: ScanType;

  @IsOptional()
  @IsString()
  notes?: string;
}
