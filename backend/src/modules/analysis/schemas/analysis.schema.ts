import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AnalysisStatus } from 'src/common/enums/analysis-status.enum';

export type AnalysisDocument = Analysis & Document;

@Schema({ timestamps: true })
export class Analysis {
  @Prop({ type: Types.ObjectId, ref: 'Scan', required: true, unique: true })
  scan!: Types.ObjectId;

  @Prop({
    required: true,
    enum: AnalysisStatus,
    default: AnalysisStatus.PENDING,
  })
  status!: AnalysisStatus;

  @Prop({ trim: true })
  prediction?: string;

  @Prop()
  confidence?: number;

  @Prop({ trim: true })
  error_message?: string;

  @Prop({ type: Object })
  raw_result?: Record<string, unknown>;
}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);
