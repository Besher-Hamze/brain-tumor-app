import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AppointmentStatus } from 'src/common/enums/appointment-status.enum';

export type AppointmentDocument = Appointment & Document;

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patient!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctor!: Types.ObjectId;

  @Prop({ required: true })
  date_time!: Date;

  @Prop({
    required: true,
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status!: AppointmentStatus;

  @Prop({ trim: true })
  notes?: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
