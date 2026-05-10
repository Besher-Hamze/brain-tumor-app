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
import { CurrentUser, Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationsService } from './notifications.service';

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
  async findAll(@CurrentUser() user: any) {
    this.logger.log(`GET /notifications -> ${user.role} ${user._id}`);
    const notifications = await this.notificationsService.findAll(
      user._id.toString(),
      user.role,
    );
    return { success: true, count: notifications.length, notifications };
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @Patch('read/all')
  async markAllAsRead(@CurrentUser() user: any) {
    this.logger.log(`PATCH /notifications/read/all`);
    const result = await this.notificationsService.markAllAsRead(
      user._id.toString(),
      user.role,
    );
    return { success: true, ...result };
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`GET /notifications/${id}`);
    const notification = await this.notificationsService.findOne(
      id,
      user._id.toString(),
      user.role,
    );
    return { success: true, notification };
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`PATCH /notifications/${id}/read`);
    const notification = await this.notificationsService.markAsRead(
      id,
      user._id.toString(),
      user.role,
    );
    return { success: true, notification };
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`PATCH /notifications/${id}`);
    const notification = await this.notificationsService.update(
      id,
      dto,
      user._id.toString(),
      user.role,
    );
    return { success: true, notification };
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`DELETE /notifications/${id}`);
    const notification = await this.notificationsService.delete(
      id,
      user._id.toString(),
      user.role,
    );
    return { success: true, notification };
  }
}
