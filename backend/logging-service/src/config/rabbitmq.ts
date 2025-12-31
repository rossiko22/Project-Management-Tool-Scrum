import * as amqp from 'amqplib';

let connection: any = null;
let channel: amqp.Channel | null = null;

export async function connectRabbitMQ(): Promise<amqp.Channel> {
  try {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
    const exchange = process.env.RABBITMQ_EXCHANGE || 'logging_exchange';
    const queue = process.env.RABBITMQ_QUEUE || 'logging_queue';
    const routingKey = process.env.RABBITMQ_ROUTING_KEY || 'logs';

    console.log('Connecting to RabbitMQ...');
    connection = await amqp.connect(rabbitmqUrl);
    const newChannel = await connection.createChannel() as amqp.Channel;
    channel = newChannel;

    // Assert exchange
    await newChannel.assertExchange(exchange, 'topic', { durable: true });
    console.log(`Exchange '${exchange}' asserted`);

    // Assert queue
    await newChannel.assertQueue(queue, { durable: true });
    console.log(`Queue '${queue}' asserted`);

    // Bind queue to exchange
    await newChannel.bindQueue(queue, exchange, routingKey);
    console.log(`Queue '${queue}' bound to exchange '${exchange}' with routing key '${routingKey}'`);

    console.log('RabbitMQ connection established successfully');
    return newChannel;
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    throw error;
  }
}

export function getRabbitMQChannel(): amqp.Channel {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
}

export async function closeRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await (connection as any).close();
    }
    console.log('RabbitMQ connection closed');
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
}
