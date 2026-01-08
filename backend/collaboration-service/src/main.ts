import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { rabbitMQLogger } from './utils/rabbitmq-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true, // Accept all origins (for development)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Correlation-Id'],
    exposedHeaders: ['Authorization', 'Content-Type', 'X-Correlation-Id'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Collaboration Service API')
    .setDescription('API documentation for the Collaboration Service - handles comments, notifications, and activity logs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Initialize RabbitMQ logger
  try {
    await rabbitMQLogger.connect();
    console.log('RabbitMQ logger initialized');
  } catch (error) {
    console.error('Failed to initialize RabbitMQ logger:', error);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Collaboration Service running on port ${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
}
bootstrap();
