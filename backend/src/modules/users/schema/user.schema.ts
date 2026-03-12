import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../../common/enums/role.enum';

export interface User {
  _id: Types.ObjectId;
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    required: true,
    enum: UserRole,
    default: UserRole.DOCTOR,
  })
  role: UserRole;

  @Prop()
  specialty: string;

  @Prop()
  hospital: string;

  @Prop()
  phone: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  profile_image: string;

  @Prop()
  last_login: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
