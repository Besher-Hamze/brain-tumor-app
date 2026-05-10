import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReportStatus } from 'src/common/enums/report-status.enum';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patient!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Scan', required: true, unique: true })
  scan!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Analysis', required: true })
  analysis!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctor!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  diagnosis!: string;

  @Prop({ trim: true })
  treatment_plan?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({
    required: true,
    enum: ReportStatus,
    default: ReportStatus.PUBLISHED,
  })
  status!: ReportStatus;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
