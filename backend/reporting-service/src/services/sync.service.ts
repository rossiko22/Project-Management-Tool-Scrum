import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { DailyBurndown } from '../entities/daily-burndown.entity';
import { TeamVelocity } from '../entities/team-velocity.entity';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly scrumApiUrl = process.env.SCRUM_API_URL || 'http://localhost:8081/api';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(DailyBurndown)
    private readonly burndownRepository: Repository<DailyBurndown>,
    @InjectRepository(TeamVelocity)
    private readonly velocityRepository: Repository<TeamVelocity>,
  ) {}

  async syncSprintData(sprintId: number): Promise<{ message: string }> {
    try {
      this.logger.log(`Syncing data for sprint ${sprintId}`);

      // Fetch sprint data from scrum-core-service
      const sprint = await this.fetchSprint(sprintId);

      if (!sprint) {
        return { message: `Sprint ${sprintId} not found` };
      }

      // Generate burndown data
      await this.generateBurndownData(sprint);

      // Generate velocity data if sprint is completed
      if (sprint.status === 'COMPLETED' && sprint.teamId) {
        await this.generateVelocityData(sprint);
      }

      return { message: `Successfully synced data for sprint ${sprintId}` };
    } catch (error) {
      this.logger.error(`Error syncing sprint ${sprintId}: ${error.message}`);
      throw error;
    }
  }

  async syncAllSprints(): Promise<{ message: string; synced: number }> {
    try {
      this.logger.log('Syncing all sprint data');

      // Fetch all sprints
      const response = await firstValueFrom(
        this.httpService.get(`${this.scrumApiUrl}/sprints`)
      );
      const sprints = response.data;

      let synced = 0;
      for (const sprint of sprints) {
        try {
          await this.syncSprintData(sprint.id);
          synced++;
        } catch (error) {
          this.logger.error(`Failed to sync sprint ${sprint.id}: ${error.message}`);
        }
      }

      return { message: `Successfully synced ${synced} sprints`, synced };
    } catch (error) {
      this.logger.error(`Error syncing all sprints: ${error.message}`);
      throw error;
    }
  }

  private async fetchSprint(sprintId: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.scrumApiUrl}/sprints/${sprintId}`)
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching sprint ${sprintId}: ${error.message}`);
      return null;
    }
  }

  private async generateBurndownData(sprint: any): Promise<void> {
    const { id, startDate, endDate, committedPoints } = sprint;

    if (!committedPoints || committedPoints === 0) {
      this.logger.warn(`Sprint ${id} has no committed points, skipping burndown generation`);
      return;
    }

    // Delete existing burndown data for this sprint
    await this.burndownRepository.delete({ sprintId: id });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Generate daily burndown data
    const burndownData: Partial<DailyBurndown>[] = [];
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const idealRemaining = Math.max(0, committedPoints * (1 - i / totalDays));

      // Simulate actual progress (in real scenario, this would come from actual task completion data)
      const progress = sprint.completedPoints
        ? Math.min(i / totalDays, sprint.completedPoints / committedPoints)
        : i / totalDays;
      const remaining = Math.max(0, committedPoints * (1 - progress));
      const completed = committedPoints - remaining;

      burndownData.push({
        sprintId: id,
        date: new Date(date.toISOString().split('T')[0]),
        remainingPoints: remaining,
        idealRemainingPoints: idealRemaining,
        completedPoints: completed,
        addedPoints: 0,
      });
    }

    await this.burndownRepository.save(burndownData);
    this.logger.log(`Generated ${burndownData.length} burndown data points for sprint ${id}`);
  }

  private async generateVelocityData(sprint: any): Promise<void> {
    const { id, teamId, endDate, velocity, name } = sprint;

    if (!teamId) {
      this.logger.warn(`Sprint ${id} has no team ID, skipping velocity generation`);
      return;
    }

    // Check if velocity data already exists
    const existing = await this.velocityRepository.findOne({
      where: { sprintId: id },
    });

    if (existing) {
      this.logger.log(`Velocity data already exists for sprint ${id}, updating`);
      existing.velocity = velocity || sprint.completedPoints || 0;
      existing.sprintEndDate = endDate;
      existing.sprintName = name;
      await this.velocityRepository.save(existing);
    } else {
      const velocityData = this.velocityRepository.create({
        teamId,
        sprintId: id,
        sprintName: name,
        velocity: velocity || sprint.completedPoints || 0,
        sprintEndDate: endDate,
      });

      await this.velocityRepository.save(velocityData);
      this.logger.log(`Generated velocity data for sprint ${id} (team ${teamId})`);
    }
  }
}
