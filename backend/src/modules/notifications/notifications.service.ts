import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    return this.notificationModel.create({
      user: new Types.ObjectId(dto.user_id),
      type: dto.type,
      message: dto.message,
      metadata: dto.metadata,
    });
  }

  async createForUser(
    userId: string,
    type: CreateNotificationDto['type'],
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<NotificationDocument> {
    return this.create({
      user_id: userId,
      type,
      message,
      metadata,
    });
  }

  async findAll(
    currentUserId: string,
    currentUserRole: string,
  ): Promise<NotificationDocument[]> {
    const filter =
      currentUserRole === UserRole.ADMIN
        ? {}
        : { user: new Types.ObjectId(currentUserId) };

    return this.notificationModel
      .find(filter)
      .populate('user', 'full_name email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findById(id)
      .populate('user', 'full_name email role')
      .exec();

    if (!notification) throw new NotFoundException(`Notification "${id}" not found`);

    if (
      currentUserRole !== UserRole.ADMIN &&
      this.extractObjectId(notification.user) !== currentUserId
    ) {
      throw new ForbiddenException('Access denied to this notification');
    }

    return notification;
  }

  async update(
    id: string,
    dto: UpdateNotificationDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<NotificationDocument> {
    await this.findOne(id, currentUserId, currentUserRole);

    const updated = await this.notificationModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('user', 'full_name email role')
      .exec();

    if (!updated) throw new NotFoundException(`Notification "${id}" not found`);
    return updated;
  }

  async markAsRead(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<NotificationDocument> {
    return this.update(id, { is_read: true }, currentUserId, currentUserRole);
  }

  async markAllAsRead(
    currentUserId: string,
    currentUserRole: string,
  ): Promise<{ modified_count: number }> {
    const filter =
      currentUserRole === UserRole.ADMIN
        ? {}
        : { user: new Types.ObjectId(currentUserId) };

    const result = await this.notificationModel
      .updateMany(filter, { is_read: true })
      .exec();

    return { modified_count: result.modifiedCount };
  }

  async delete(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<NotificationDocument> {
    await this.findOne(id, currentUserId, currentUserRole);

    const deleted = await this.notificationModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`Notification "${id}" not found`);
    return deleted;
  }

  private extractObjectId(value: unknown): string {
    if (value instanceof Types.ObjectId) return value.toString();
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && '_id' in value) {
      return String((value as { _id: unknown })._id);
    }
    return String(value);
  }
}
