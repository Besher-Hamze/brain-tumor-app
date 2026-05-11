import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schema/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findByRole(role: UserRole): Promise<UserDocument[]> {
    return this.userModel
      .find({ role, is_active: true })
      .select('-password')
      .exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    try {
      const user = await this.userModel
        .findById(id)
        .select('-password')
        .exec();
      if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
      return user;
    } catch (error) {
      if (error instanceof Error && error.name === 'CastError') {
        throw new NotFoundException(`Invalid User ID "${id}"`);
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findById(id).exec();
    if (!existingUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const duplicate = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: existingUser._id },
      });
      if (duplicate) throw new ConflictException('Email already exists');
    }

    const update = { ...updateUserDto };
    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10);
    }

    const updated = await this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .select('-password')
      .exec();

    if (!updated) throw new NotFoundException(`User with ID "${id}" not found`);
    return updated;
  }

  async deactivate(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { is_active: false }, { new: true })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
    return user;
  }

  async activate(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { is_active: true }, { new: true })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
    return user;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { last_login: new Date() });
  }

  async updatePassword(id: string, password: string): Promise<void> {
    const hashed = await bcrypt.hash(password, 10);
    await this.userModel.findByIdAndUpdate(id, { password: hashed }).exec();
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
