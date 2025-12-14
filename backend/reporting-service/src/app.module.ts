import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { SprintMetricsModule } from './modules/sprint-metrics.module';
import { BurndownModule } from './modules/burndown.module';
import { CumulativeFlowModule } from './modules/cumulative-flow.module';
import { VelocityModule } from './modules/velocity.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USER', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'reporting_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    SprintMetricsModule,
    BurndownModule,
    CumulativeFlowModule,
    VelocityModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
