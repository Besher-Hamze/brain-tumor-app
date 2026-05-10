import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType } from 'src/common/enums/notification-type.enum';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({
    required: true,
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  type!: NotificationType;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ default: false })
  is_read!: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
