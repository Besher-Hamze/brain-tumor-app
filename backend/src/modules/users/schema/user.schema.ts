import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../../common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  full_name!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({
    type: String,
    required: true,
    enum: UserRole,
    default: UserRole.DOCTOR,
  })
  role!: UserRole;

  @Prop({ trim: true })
  specialty?: string;

  @Prop({ trim: true })
  hospital?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ default: true })
  is_active!: boolean;

  @Prop({ trim: true })
  profile_image?: string;

  @Prop()
  last_login?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
