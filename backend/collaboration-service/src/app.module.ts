import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Entities
import { Comment } from './entities/comment.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { Notification } from './entities/notification.entity';

// Services
import { CommentService } from './services/comment.service';
import { NotificationService } from './services/notification.service';
import { ActivityLogService } from './services/activity-log.service';
import { KafkaConsumerService } from './services/kafka-consumer.service';

// Controllers
import { AppController } from './app.controller';
import { CommentController } from './controllers/comment.controller';
import { NotificationController } from './controllers/notification.controller';
import { ActivityController } from './controllers/activity.controller';

// Gateways
import { EventsGateway } from './gateways/events.gateway';

// Middleware
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [Comment, ActivityLog, Notification],
        synchronize: false, // Use migrations in production
        logging: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Comment, ActivityLog, Notification]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController, CommentController, NotificationController, ActivityController],
  providers: [
    CommentService,
    NotificationService,
    ActivityLogService,
    KafkaConsumerService,
    EventsGateway,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*');
  }
}
