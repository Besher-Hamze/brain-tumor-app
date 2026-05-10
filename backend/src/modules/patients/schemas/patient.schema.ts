import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Gender } from 'src/common/enums/gender.enum';
import { BloodType } from 'src/common/enums/blood-type.enum';

export type PatientDocument = Patient & Document;

@Schema({ timestamps: true })
export class Patient {
  @Prop({ default: () => uuidv4(), unique: true })
  medical_record_number!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  full_name!: string;

  @Prop({ required: true })
  date_of_birth!: Date;

  @Prop({ type: String, required: true, enum: Gender })
  gender!: Gender;

  @Prop({ required: true })
  phone!: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ type: String, enum: BloodType })
  blood_type?: BloodType;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctor!: Types.ObjectId;

  @Prop({ default: true })
  is_active!: boolean;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
