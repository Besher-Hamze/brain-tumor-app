import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { AnalysisStatus } from 'src/common/enums/analysis-status.enum';

export class CreateAnalysisDto {
  @IsNotEmpty()
  @IsString()
  scan_id!: string;

  @IsOptional()
  @IsEnum(AnalysisStatus)
  status?: AnalysisStatus;

  @IsOptional()
  @IsString()
  prediction?: string;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  @IsOptional()
  @IsString()
  error_message?: string;

  @IsOptional()
  @IsObject()
  raw_result?: Record<string, unknown>;
}
