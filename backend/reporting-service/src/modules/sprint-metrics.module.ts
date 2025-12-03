import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SprintMetrics } from '../entities/sprint-metrics.entity';
import { SprintMetricsController } from '../controllers/sprint-metrics.controller';
import { SprintMetricsService } from '../services/sprint-metrics.service';

@Module({
  imports: [TypeOrmModule.forFeature([SprintMetrics])],
  controllers: [SprintMetricsController],
  providers: [SprintMetricsService],
  exports: [SprintMetricsService],
})
export class SprintMetricsModule {}
