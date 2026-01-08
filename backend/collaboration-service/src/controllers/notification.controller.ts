import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { rabbitMQLogger } from '../utils/rabbitmq-logger';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(@Request() req) {
    const url = `/notifications`;
    rabbitMQLogger.logInfo(`Retrieving notifications for user ${req.user.userId}`, url);

    try {
      const result = await this.notificationService.getUserNotifications(req.user.userId);
      rabbitMQLogger.logInfo(`Retrieved ${result.length} notifications for user ${req.user.userId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to retrieve notifications for user ${req.user.userId}: ${error.message}`, url);
      throw error;
    }
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const url = `/notifications/unread-count`;
    rabbitMQLogger.logInfo(`Retrieving unread notification count for user ${req.user.userId}`, url);

    try {
      const count = await this.notificationService.getUnreadCount(req.user.userId);
      rabbitMQLogger.logInfo(`User ${req.user.userId} has ${count} unread notifications`, url);
      return { count };
    } catch (error) {
      rabbitMQLogger.logError(`Failed to retrieve unread count for user ${req.user.userId}: ${error.message}`, url);
      throw error;
    }
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: number) {
    const url = `/notifications/${id}/read`;
    rabbitMQLogger.logInfo(`Marking notification ${id} as read`, url);

    try {
      await this.notificationService.markAsRead(id);
      rabbitMQLogger.logInfo(`Notification ${id} marked as read`, url);
      return { message: 'Notification marked as read' };
    } catch (error) {
      rabbitMQLogger.logError(`Failed to mark notification ${id} as read: ${error.message}`, url);
      throw error;
    }
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Request() req) {
    const url = `/notifications/mark-all-read`;
    rabbitMQLogger.logInfo(`Marking all notifications as read for user ${req.user.userId}`, url);

    try {
      await this.notificationService.markAllAsRead(req.user.userId);
      rabbitMQLogger.logInfo(`All notifications marked as read for user ${req.user.userId}`, url);
      return { message: 'All notifications marked as read' };
    } catch (error) {
      rabbitMQLogger.logError(`Failed to mark all notifications as read for user ${req.user.userId}: ${error.message}`, url);
      throw error;
    }
  }
}
