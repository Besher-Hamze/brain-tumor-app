import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from 'src/common/enums/report-status.enum';

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  diagnosis?: string;

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
