import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  async createLog(
    actorId: number,
    action: string,
    entityType: string,
    entityId: number,
    projectId?: number,
    details?: any,
  ): Promise<ActivityLog> {
    const log = this.activityLogRepository.create({
      actorId,
      action,
      entityType,
      entityId,
      projectId,
      details,
    });
    return this.activityLogRepository.save(log);
  }

  async getProjectActivityLogs(
    projectId: number,
    limit: number = 50,
  ): Promise<ActivityLog[]> {
    return this.activityLogRepository.find({
      where: { projectId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getUserActivityLogs(
    actorId: number,
    limit: number = 50,
  ): Promise<ActivityLog[]> {
    return this.activityLogRepository.find({
      where: { actorId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }
}
