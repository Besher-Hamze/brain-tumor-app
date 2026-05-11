import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ReportStatus } from 'src/common/enums/report-status.enum';

export class CreateReportDto {
  @IsNotEmpty()
  @IsString()
  patient_id!: string;

  @IsNotEmpty()
  @IsString()
  scan_id!: string;

  @IsNotEmpty()
  @IsString()
  analysis_id!: string;

  @IsNotEmpty()
  @IsString()
  diagnosis!: string;

  @IsOptional()
  @IsString()
  treatment_plan?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
