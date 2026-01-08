import { Channel } from 'amqplib';
import { getRabbitMQChannel } from '../config/rabbitmq';
import { parseLogMessage, Log } from '../models/Log';
import logService from './log.service';

export class RabbitMQService {
  private channel: Channel | null = null;
  private isConsuming: boolean = false;

  async startConsumer(): Promise<void> {
    try {
      this.channel = getRabbitMQChannel();
      const queue = process.env.RABBITMQ_QUEUE || 'logging_queue';

      console.log(`Starting RabbitMQ consumer for queue: ${queue}`);

      this.channel.prefetch(10); // Process 10 messages at a time

      await this.channel.consume(
        queue,
        async (msg) => {
          if (msg) {
            try {
              const content = msg.content.toString();
              console.log('Received message from RabbitMQ:', content.substring(0, 200));
              const log = parseLogMessage(content);

              if (log) {
                await logService.saveLogs([log]);
                this.channel?.ack(msg);
                console.log('Successfully processed and saved log');
              } else {
                console.warn('Failed to parse log message, rejecting');
                console.warn('Message content:', content);
                this.channel?.nack(msg, false, false); // Reject and don't requeue
              }
            } catch (error) {
              console.error('Error processing message:', error);
              this.channel?.nack(msg, false, false); // Reject and don't requeue (changed from requeue)
            }
          }
        },
        { noAck: false }
      );

      this.isConsuming = true;
      console.log('RabbitMQ consumer started successfully');
    } catch (error) {
      console.error('Error starting RabbitMQ consumer:', error);
      throw error;
    }
  }

  async consumeAllLogs(): Promise<Log[]> {
    try {
      this.channel = getRabbitMQChannel();
      const queue = process.env.RABBITMQ_QUEUE || 'logging_queue';

      console.log(`Consuming all logs from queue: ${queue}`);

      const logs: Log[] = [];
      let messageCount = 0;

      // Get messages until queue is empty
      while (true) {
        const msg = await this.channel.get(queue, { noAck: false });

        if (!msg) {
          break; // No more messages
        }

        messageCount++;
        const content = msg.content.toString();
        const log = parseLogMessage(content);

        if (log) {
          logs.push(log);
          this.channel.ack(msg);
        } else {
          console.warn('Failed to parse log message, rejecting:', content);
          this.channel.nack(msg, false, false);
        }
      }

      console.log(`Consumed ${logs.length} logs from RabbitMQ (${messageCount} messages processed)`);
      return logs;
    } catch (error) {
      console.error('Error consuming all logs from RabbitMQ:', error);
      throw error;
    }
  }

  isActive(): boolean {
    return this.isConsuming;
  }

  async stopConsumer(): Promise<void> {
    if (this.channel) {
      await this.channel.cancel('');
      this.isConsuming = false;
      console.log('RabbitMQ consumer stopped');
    }
  }
}

export default new RabbitMQService();
