import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUserId, GetUserRole, Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateNotificationDto) {
    this.logger.log(`POST /notifications -> user: ${dto.user_id}`);
    const notification = await this.notificationsService.create(dto);
    return { success: true, notification };
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @Get()
  async findAll(
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /notifications -> ${role} ${userId}`);
    const notifications = await this.notificationsService.findAll(userId, role);
    return { success: true, count: notifications.length, notifications };
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @Patch('read/all')
  async markAllAsRead(
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log('PATCH /notifications/read/all');
    const result = await this.notificationsService.markAllAsRead(userId, role);
    return { success: true, ...result };
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`GET /notifications/${id}`);
    const notification = await this.notificationsService.findOne(
      id,
      userId,
      role,
    );
    return { success: true, notification };
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`PATCH /notifications/${id}/read`);
    const notification = await this.notificationsService.markAsRead(
      id,
      userId,
      role,
    );
    return { success: true, notification };
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`PATCH /notifications/${id}`);
    const notification = await this.notificationsService.update(
      id,
      dto,
      userId,
      role,
    );
    return { success: true, notification };
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @GetUserId() userId: string,
    @GetUserRole() role: UserRole,
  ) {
    this.logger.log(`DELETE /notifications/${id}`);
    const notification = await this.notificationsService.delete(id, userId, role);
    return { success: true, notification };
  }
}
