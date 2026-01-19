import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer } from 'kafkajs';
import { ActivityLogService } from './activity-log.service';
import { NotificationService } from './notification.service';
import { EventsGateway } from '../gateways/events.gateway';
import { NotificationType } from '../entities/notification.entity';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private configService: ConfigService,
    private activityLogService: ActivityLogService,
    private notificationService: NotificationService,
    private eventsGateway: EventsGateway,
  ) {
    this.kafka = new Kafka({
      clientId: 'collaboration-service',
      brokers: [this.configService.get<string>('KAFKA_BROKER') || 'localhost:9092'],
    });

    this.consumer = this.kafka.consumer({
      groupId: this.configService.get<string>('KAFKA_GROUP_ID') || 'collaboration-service-group',
    });
  }

  async onModuleInit() {
    await this.consumer.connect();

    // Subscribe to relevant topics
    await this.consumer.subscribe({ topics: [
      'scrum.task',
      'scrum.sprint',
      'scrum.backlog-item',
      'scrum.impediment',
      'identity.user',
      'identity.team',
      'identity.project',
    ], fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (message.value) {
          const event = JSON.parse(message.value.toString());
          await this.handleEvent(topic, event);
        }
      },
    });

    console.log('Kafka consumer started and listening...');
  }

  private async handleEvent(topic: string, event: any) {
    console.log(`Received event from topic ${topic}:`, event);

    try {
      // Create activity log for all events with performedBy
      if (event.performedBy && event.projectId) {
        await this.activityLogService.createLog(
          event.performedBy,
          event.action || topic,
          topic.replace('.', '_'),
          event.taskId || event.sprintId || event.itemId || event.userId || event.teamId || event.projectId,
          event.projectId,
          event,
        );
      }

      // Handle events based on topic and action
      if (topic === 'scrum.task') {
        if (event.action === 'STATUS_CHANGED') {
          await this.handleTaskStatusChanged(event);
        } else if (event.action === 'ASSIGNED') {
          await this.handleTaskAssigned(event);
        }
      } else if (topic === 'scrum.sprint') {
        if (event.action === 'STARTED') {
          await this.handleSprintStarted(event);
        } else if (event.action === 'COMPLETED') {
          await this.handleSprintCompleted(event);
        }
      } else if (topic === 'scrum.impediment') {
        if (event.action === 'CREATED') {
          await this.handleImpedimentCreated(event);
        } else if (event.action === 'RESOLVED') {
          await this.handleImpedimentResolved(event);
        }
      }
    } catch (error) {
      console.error(`Error handling event from ${topic}:`, error);
    }
  }

  private async handleTaskStatusChanged(event: any) {
    // Emit real-time update to sprint room
    if (event.sprintId) {
      this.eventsGateway.emitToSprint(event.sprintId, 'task.status.changed', {
        taskId: event.taskId,
        newStatus: event.status,
        title: event.title,
        assigneeId: event.assigneeId,
      });
    }
  }

  private async handleTaskAssigned(event: any) {
    // Create notification for assignee
    if (event.assigneeId) {
      await this.notificationService.createNotification(
        event.assigneeId,
        NotificationType.TASK_ASSIGNED,
        {
          taskId: event.taskId,
          taskTitle: event.title,
          assignedBy: event.performedBy,
        },
      );

      // Emit real-time notification
      this.eventsGateway.emitToUser(event.assigneeId, 'notification', {
        type: 'TASK_ASSIGNED',
        message: `You have been assigned to task: ${event.title}`,
      });
    }
  }

  private async handleSprintStarted(event: any) {
    // Emit to project room
    if (event.projectId) {
      this.eventsGateway.emitToProject(event.projectId, 'sprint.started', {
        sprintId: event.sprintId,
        sprintName: event.sprintName,
        sprintGoal: event.sprintGoal,
        committedPoints: event.committedPoints,
        startDate: event.startDate,
        endDate: event.endDate,
      });
    }
  }

  private async handleSprintCompleted(event: any) {
    // Emit to project room
    if (event.projectId) {
      this.eventsGateway.emitToProject(event.projectId, 'sprint.completed', {
        sprintId: event.sprintId,
        sprintName: event.sprintName,
        completedPoints: event.completedPoints,
        velocity: event.velocity,
        storiesCompleted: event.storiesCompleted,
      });
    }
  }

  private async handleImpedimentCreated(event: any) {
    // Notify all team members about the new impediment
    // For now, we'll create a notification for the Scrum Master (if we had their ID)
    // In a real scenario, you'd query the identity service for team members
    if (event.projectId) {
      this.eventsGateway.emitToProject(event.projectId, 'impediment.created', {
        impedimentId: event.impedimentId,
        title: event.title,
        description: event.description,
        reportedBy: event.reportedBy,
        sprintId: event.sprintId,
      });
    }

    // If there's a specific assignee, notify them
    if (event.assignedTo) {
      await this.notificationService.createNotification(
        event.assignedTo,
        NotificationType.IMPEDIMENT_REPORTED,
        {
          impedimentId: event.impedimentId,
          title: event.title,
          description: event.description,
          reportedBy: event.reportedBy,
          message: `New impediment reported: ${event.title}`,
        },
      );

      this.eventsGateway.emitToUser(event.assignedTo, 'notification', {
        type: 'IMPEDIMENT_REPORTED',
        message: `New impediment reported: ${event.title}`,
      });
    }
  }

  private async handleImpedimentResolved(event: any) {
    // Notify the reporter that their impediment was resolved
    if (event.reportedBy) {
      await this.notificationService.createNotification(
        event.reportedBy,
        NotificationType.IMPEDIMENT_RESOLVED,
        {
          impedimentId: event.impedimentId,
          title: event.title,
          resolution: event.resolution,
          resolvedBy: event.resolvedBy,
          message: `Impediment resolved: ${event.title}`,
        },
      );

      this.eventsGateway.emitToUser(event.reportedBy, 'notification', {
        type: 'IMPEDIMENT_RESOLVED',
        message: `Your impediment has been resolved: ${event.title}`,
      });
    }

    // Emit to project room
    if (event.projectId) {
      this.eventsGateway.emitToProject(event.projectId, 'impediment.resolved', {
        impedimentId: event.impedimentId,
        title: event.title,
        resolution: event.resolution,
        resolvedBy: event.resolvedBy,
      });
    }
  }
}
