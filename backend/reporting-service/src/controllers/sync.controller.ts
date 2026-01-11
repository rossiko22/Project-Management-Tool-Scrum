import { Controller, Post, Param, ParseIntPipe, Get, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncService } from '../services/sync.service';
import { SprintCompletionService } from '../services/sprint-completion.service';
import { DailyBurndown } from '../entities/daily-burndown.entity';
import { TeamVelocity } from '../entities/team-velocity.entity';
import { rabbitMQLogger } from '../utils/rabbitmq-logger';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly sprintCompletionService: SprintCompletionService,
    @InjectRepository(DailyBurndown)
    private readonly burndownRepository: Repository<DailyBurndown>,
    @InjectRepository(TeamVelocity)
    private readonly velocityRepository: Repository<TeamVelocity>,
  ) {}

  @Post('sprint/:sprintId')
  async syncSprint(@Param('sprintId', ParseIntPipe) sprintId: number) {
    const url = `/api/sync/sprint/${sprintId}`;
    rabbitMQLogger.logInfo(`Syncing data for sprint ${sprintId}`, url);

    try {
      const result = await this.syncService.syncSprintData(sprintId);
      rabbitMQLogger.logInfo(`Successfully synced sprint ${sprintId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to sync sprint ${sprintId}: ${error.message}`, url);
      throw error;
    }
  }

  @Post('all')
  async syncAll() {
    const url = `/api/sync/all`;
    rabbitMQLogger.logInfo('Syncing all sprint data', url);

    try {
      const result = await this.syncService.syncAllSprints();
      rabbitMQLogger.logInfo(`Successfully synced ${result.synced} sprints`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to sync all sprints: ${error.message}`, url);
      throw error;
    }
  }

  @Post('sprint-completion')
  async recordSprintCompletion(@Body() sprintData: {
    sprintId: number;
    projectId: number;
    teamId: number;
    sprintName: string;
    endDate: string;
    completedPoints?: number;
    velocity?: number;
    storiesCompleted?: number;
  }) {
    const url = `/api/sync/sprint-completion`;
    rabbitMQLogger.logInfo(`Recording sprint completion for sprint ${sprintData.sprintId} (${sprintData.sprintName})`, url);

    try {
      await this.sprintCompletionService.handleSprintCompletion(sprintData);
      rabbitMQLogger.logInfo(`Successfully recorded metrics for sprint ${sprintData.sprintId}: ${sprintData.velocity} points`, url);
      return {
        success: true,
        message: 'Sprint metrics recorded successfully',
        sprintId: sprintData.sprintId,
        velocity: sprintData.velocity,
      };
    } catch (error) {
      rabbitMQLogger.logError(`Failed to record sprint completion for sprint ${sprintData.sprintId}: ${error.message}`, url);
      throw error;
    }
  }

  @Post('test-data')
  async generateTestData() {
    const url = `/api/sync/test-data`;
    rabbitMQLogger.logInfo('Generating test data', url);

    try {
      // Generate sample velocity data for team 1
      const velocityData: Partial<TeamVelocity>[] = [];
      for (let i = 1; i <= 10; i++) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - (10 - i) * 14); // 2 weeks apart

        velocityData.push({
          teamId: 1,
          sprintId: i,
          sprintName: `Sprint ${i}`,
          velocity: Math.floor(20 + Math.random() * 15), // Random velocity between 20-35
          sprintEndDate: endDate,
        });
      }
      await this.velocityRepository.save(velocityData);

      // Generate sample burndown data for sprint 1
      const burndownData: Partial<DailyBurndown>[] = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14); // 2 weeks ago
      const committedPoints = 50;

      for (let day = 0; day <= 14; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + day);

        const idealRemaining = Math.max(0, committedPoints * (1 - day / 14));
        const progress = Math.min(1, day / 14 + Math.random() * 0.1); // Slightly random progress
        const remaining = Math.max(0, committedPoints * (1 - progress));
        const completed = committedPoints - remaining;

        burndownData.push({
          sprintId: 1,
          date: new Date(date.toISOString().split('T')[0]),
          remainingPoints: remaining,
          idealRemainingPoints: idealRemaining,
          completedPoints: completed,
          addedPoints: 0,
        });
      }
      await this.burndownRepository.save(burndownData);

      rabbitMQLogger.logInfo('Test data generated successfully', url);
      return {
        message: 'Test data generated successfully',
        velocity: velocityData.length,
        burndown: burndownData.length,
      };
    } catch (error) {
      rabbitMQLogger.logError(`Failed to generate test data: ${error.message}`, url);
      throw error;
    }
  }
}
