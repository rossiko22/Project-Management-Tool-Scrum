import * as amqplib from 'amqplib';
import { getCorrelationId } from '../middleware/correlation-id.middleware';

class RabbitMQLogger {
  private connection: any = null;
  private channel: any = null;
  private exchange = 'logging_exchange';
  private routingKey = 'logs';
  private applicationName = 'reporting-service';

  async connect(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
      this.connection = await amqplib.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

      console.log('RabbitMQ Logger connected successfully');
    } catch (error) {
      console.error('Failed to connect RabbitMQ Logger:', error);
    }
  }

  private async sendLog(logType: string, message: string, url?: string): Promise<void> {
    if (!this.channel) {
      console.warn('RabbitMQ channel not initialized, skipping log');
      return;
    }

    try {
      const correlationId = getCorrelationId();

      const logMessage = {
        timestamp: new Date().toISOString(),
        logType,
        url: url || '',
        correlationId,
        applicationName: this.applicationName,
        message,
      };

      const messageBuffer = Buffer.from(JSON.stringify(logMessage));

      this.channel.publish(
        this.exchange,
        this.routingKey,
        messageBuffer,
        { persistent: true }
      );
    } catch (error) {
      console.error('Failed to send log to RabbitMQ:', error);
    }
  }

  logInfo(message: string, url?: string): void {
    this.sendLog('INFO', message, url);
  }

  logWarn(message: string, url?: string): void {
    this.sendLog('WARN', message, url);
  }

  logError(message: string, url?: string): void {
    this.sendLog('ERROR', message, url);
  }

  logDebug(message: string, url?: string): void {
    this.sendLog('DEBUG', message, url);
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    console.log('RabbitMQ Logger closed');
  }
}

export const rabbitMQLogger = new RabbitMQLogger();
