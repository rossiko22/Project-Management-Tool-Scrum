import { Controller, Get, Patch, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { NotificationType } from '../entities/notification.entity';
import { rabbitMQLogger } from '../utils/rabbitmq-logger';

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post()
  async createNotification(@Body() body: { recipientId: number; type: NotificationType; payload: any }) {
    const url = `/notifications`;
    rabbitMQLogger.logInfo(`Creating notification for user ${body.recipientId}, type: ${body.type}`, url);

    try {
      const notification = await this.notificationService.createNotification(
        body.recipientId,
        body.type,
        body.payload,
      );
      rabbitMQLogger.logInfo(`Notification ${notification.id} created for user ${body.recipientId}`, url);
      return notification;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to create notification: ${error.message}`, url);
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
