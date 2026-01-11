import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from '../controllers/sync.controller';
import { SyncService } from '../services/sync.service';
import { SprintCompletionService } from '../services/sprint-completion.service';
import { DailyBurndown } from '../entities/daily-burndown.entity';
import { TeamVelocity } from '../entities/team-velocity.entity';
import { ProjectBurndown } from '../entities/project-burndown.entity';
import { SprintMetrics } from '../entities/sprint-metrics.entity';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    TypeOrmModule.forFeature([DailyBurndown, TeamVelocity, ProjectBurndown, SprintMetrics]),
  ],
  controllers: [SyncController],
  providers: [SyncService, SprintCompletionService],
  exports: [SyncService, SprintCompletionService, TypeOrmModule],
})
export class SyncModule {}
