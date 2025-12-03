import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    recipientId: number,
    type: NotificationType,
    payload: any,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      recipientId,
      type,
      payload,
    });
    return this.notificationRepository.save(notification);
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { recipientId: userId, read: false },
    });
  }

  async markAsRead(id: number): Promise<void> {
    await this.notificationRepository.update(id, {
      read: true,
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { recipientId: userId, read: false },
      { read: true, readAt: new Date() },
    );
  }
}
