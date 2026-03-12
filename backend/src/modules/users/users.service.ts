import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Create new user (admin creates doctors)
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return user;
  }

  // Get all users
  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  // Get all active doctors
  async findAllDoctors(): Promise<UserDocument[]> {
    return this.userModel
      .find({ role: 'doctor', is_active: true })
      .select('-password')
      .exec();
  }

  // Get one by ID
  async findOne(id: string): Promise<UserDocument> {
    try {
      const user = await this.userModel.findById(id).select('-password').exec();
      if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
      return user;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundException(`Invalid User ID "${id}"`);
      }
      throw error;
    }
  }

  // Get by email (used by auth)
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  // Update user
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

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updated = await this.userModel
      .findByIdAndUpdate(id, { ...updateUserDto }, { new: true })
      .select('-password')
      .exec();

    if (!updated) throw new NotFoundException(`User with ID "${id}" not found`);  // ← add this
    return updated;
  }

  // Deactivate user (soft delete)
async deactivate(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { is_active: false }, { new: true })
      .select('-password')
      .exec();

    if (!user) throw new NotFoundException(`User with ID "${id}" not found`);  // ← add this
    return user;
  }


  // Update last login timestamp
  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { last_login: new Date() });
  }

  // Compare passwords (used by auth)
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
