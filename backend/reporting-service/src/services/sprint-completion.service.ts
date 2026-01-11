import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamVelocity } from '../entities/team-velocity.entity';
import { ProjectBurndown } from '../entities/project-burndown.entity';
import { SprintMetrics } from '../entities/sprint-metrics.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface SprintEvent {
  sprintId: number;
  projectId: number;
  teamId: number;
  sprintName: string;
  endDate: string;
  completedPoints?: number;
  velocity?: number;
  storiesCompleted?: number;
  backlogItemsRemaining?: number;
}

interface BacklogItem {
  id: number;
  status: string;
}

@Injectable()
export class SprintCompletionService {
  constructor(
    @InjectRepository(TeamVelocity)
    private readonly velocityRepository: Repository<TeamVelocity>,
    @InjectRepository(ProjectBurndown)
    private readonly burndownRepository: Repository<ProjectBurndown>,
    @InjectRepository(SprintMetrics)
    private readonly metricsRepository: Repository<SprintMetrics>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async handleSprintCompletion(event: SprintEvent): Promise<void> {
    console.log(`📊 Handling sprint completion for sprint ${event.sprintId}`);

    try {
      // 1. Save velocity data
      await this.saveVelocityData(event);

      // 2. Calculate and save burndown data
      await this.saveBurndownData(event);

      // 3. Save sprint metrics
      await this.saveSprintMetrics(event);

      console.log(`✅ All metrics saved for sprint ${event.sprintId}`);
    } catch (error) {
      console.error(`❌ Error handling sprint completion for sprint ${event.sprintId}:`, error);
      throw error;
    }
  }

  private async saveVelocityData(event: SprintEvent): Promise<void> {
    console.log(`💾 Saving velocity data for sprint ${event.sprintId}`);

    // Check if velocity data already exists for this sprint
    const existing = await this.velocityRepository.findOne({
      where: { sprintId: event.sprintId },
    });

    if (existing) {
      console.log(`ℹ️ Velocity data already exists for sprint ${event.sprintId}, updating...`);
      existing.velocity = event.velocity || event.completedPoints || 0;
      existing.sprintEndDate = new Date(event.endDate);
      await this.velocityRepository.save(existing);
    } else {
      const velocity = this.velocityRepository.create({
        teamId: event.teamId,
        sprintId: event.sprintId,
        sprintName: event.sprintName,
        velocity: event.velocity || event.completedPoints || 0,
        sprintEndDate: new Date(event.endDate),
      });

      await this.velocityRepository.save(velocity);
      console.log(`✅ Velocity data saved: ${velocity.velocity} points`);
    }
  }

  private async saveBurndownData(event: SprintEvent): Promise<void> {
    console.log(`💾 Calculating burndown data for sprint ${event.sprintId}`);

    try {
      // Use backlog count provided by scrum-core-service (no API call needed!)
      const remainingItems = event.backlogItemsRemaining || 0;

      // Calculate sprint number for this project
      const previousSprints = await this.burndownRepository.count({
        where: { projectId: event.projectId },
      });
      const sprintNumber = previousSprints + 1;

      console.log(`📈 Sprint ${sprintNumber}: ${remainingItems} items remaining, ${event.storiesCompleted || 0} completed in this sprint`);

      // Check if burndown data already exists for this sprint
      const existing = await this.burndownRepository.findOne({
        where: { sprintId: event.sprintId },
      });

      if (existing) {
        console.log(`ℹ️ Burndown data already exists for sprint ${event.sprintId}, updating...`);
        existing.backlogItemsRemaining = remainingItems;
        existing.itemsCompletedInSprint = event.storiesCompleted || 0;
        existing.completedPoints = event.completedPoints || 0;
        existing.sprintEndDate = new Date(event.endDate);
        await this.burndownRepository.save(existing);
      } else {
        const burndown = this.burndownRepository.create({
          projectId: event.projectId,
          sprintId: event.sprintId,
          sprintNumber: sprintNumber,
          sprintName: event.sprintName,
          backlogItemsRemaining: remainingItems,
          itemsCompletedInSprint: event.storiesCompleted || 0,
          completedPoints: event.completedPoints || 0,
          sprintEndDate: new Date(event.endDate),
        });

        await this.burndownRepository.save(burndown);
        console.log(`✅ Burndown data saved: Sprint ${sprintNumber}, ${remainingItems} items remaining`);
      }
    } catch (error) {
      console.error(`❌ Error saving burndown data:`, error);
      // Don't throw - velocity data is already saved
    }
  }

  private async saveSprintMetrics(event: SprintEvent): Promise<void> {
    console.log(`💾 Saving sprint metrics for sprint ${event.sprintId}`);

    // Check if metrics already exist for this sprint
    const existing = await this.metricsRepository.findOne({
      where: { sprintId: event.sprintId },
    });

    if (existing) {
      console.log(`ℹ️ Sprint metrics already exist for sprint ${event.sprintId}, updating...`);
      existing.completedPoints = event.completedPoints || 0;
      existing.velocity = event.velocity || event.completedPoints || 0;
      existing.storiesCompleted = event.storiesCompleted || 0;
      existing.sprintEnd = new Date(event.endDate);
      await this.metricsRepository.save(existing);
    } else {
      const metrics = this.metricsRepository.create({
        sprintId: event.sprintId,
        projectId: event.projectId,
        teamId: event.teamId,
        completedPoints: event.completedPoints || 0,
        velocity: event.velocity || event.completedPoints || 0,
        storiesCompleted: event.storiesCompleted || 0,
        sprintEnd: new Date(event.endDate),
      });

      await this.metricsRepository.save(metrics);
      console.log(`✅ Sprint metrics saved`);
    }
  }
}
