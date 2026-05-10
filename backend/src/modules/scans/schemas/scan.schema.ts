import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ScanType } from 'src/common/enums/scan-type.enum';

export type ScanDocument = Scan & Document;

@Schema({ timestamps: true })
export class Scan {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patient!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploaded_by!: Types.ObjectId;

  @Prop({ required: true, enum: ScanType })
  type!: ScanType;

  @Prop({ required: true })
  file_path!: string;

  @Prop({ required: true })
  file_url!: string;

  @Prop({ required: true })
  original_name!: string;

  @Prop({ required: true })
  mime_type!: string;

  @Prop({ required: true })
  size!: number;

  @Prop()
  notes?: string;

  @Prop({ default: false })
  has_ai_result!: boolean;

  @Prop()
  ai_result_id?: string;
}

export const ScanSchema = SchemaFactory.createForClass(Scan);
