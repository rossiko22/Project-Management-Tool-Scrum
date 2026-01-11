import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { SprintCompletionService } from '../services/sprint-completion.service';

interface SprintEvent {
  sprintId: number;
  projectId: number;
  teamId: number;
  sprintName: string;
  sprintGoal: string;
  status: string;
  startDate: string;
  endDate: string;
  committedPoints?: number;
  completedPoints?: number;
  velocity?: number;
  storiesCompleted?: number;
  action: string;
  timestamp: string;
  performedBy?: number;
}

@Injectable()
export class SprintEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly configService: ConfigService,
    private readonly sprintCompletionService: SprintCompletionService,
  ) {
    const kafkaBroker = this.configService.get<string>('KAFKA_BROKER', 'localhost:9092');

    this.kafka = new Kafka({
      clientId: 'reporting-service',
      brokers: [kafkaBroker],
      retry: {
        retries: 5,
        initialRetryTime: 100,
        maxRetryTime: 30000,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: 'reporting-service-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      console.log('✅ Kafka consumer connected');

      await this.consumer.subscribe({
        topic: 'scrum.sprint',
        fromBeginning: false
      });
      console.log('✅ Subscribed to scrum.sprint topic');

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      console.log('✅ Kafka consumer is now running');
    } catch (error) {
      console.error('❌ Failed to initialize Kafka consumer:', error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.consumer.disconnect();
      console.log('✅ Kafka consumer disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting Kafka consumer:', error);
    }
  }

  private async handleMessage(payload: EachMessagePayload) {
    const { topic, partition, message } = payload;

    try {
      const value = message.value?.toString();
      if (!value) {
        console.warn('⚠️ Received empty message');
        return;
      }

      const event: SprintEvent = JSON.parse(value);

      console.log(`📨 Received sprint event: ${event.action} for sprint ${event.sprintId} (${event.sprintName})`);

      // Only process COMPLETED sprint events
      if (event.action === 'COMPLETED' && event.status === 'COMPLETED') {
        console.log(`🎯 Processing sprint completion for sprint ${event.sprintId}`);
        await this.sprintCompletionService.handleSprintCompletion(event);
        console.log(`✅ Sprint completion processed successfully for sprint ${event.sprintId}`);
      } else {
        console.log(`ℹ️ Ignoring event with action: ${event.action}, status: ${event.status}`);
      }
    } catch (error) {
      console.error('❌ Error processing sprint event:', error);
      console.error('Message value:', message.value?.toString());
    }
  }
}
