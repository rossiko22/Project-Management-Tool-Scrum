import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SprintEventsConsumer } from '../kafka/sprint-events.consumer';
import { SprintCompletionService } from '../services/sprint-completion.service';
import { TeamVelocity } from '../entities/team-velocity.entity';
import { ProjectBurndown } from '../entities/project-burndown.entity';
import { SprintMetrics } from '../entities/sprint-metrics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeamVelocity,
      ProjectBurndown,
      SprintMetrics,
    ]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [SprintEventsConsumer, SprintCompletionService],
  exports: [SprintCompletionService],
})
export class KafkaModule {}
