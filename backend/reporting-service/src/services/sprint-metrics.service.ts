import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SprintMetrics } from '../entities/sprint-metrics.entity';
import { CreateSprintMetricsDto } from '../dto/create-sprint-metrics.dto';

@Injectable()
export class SprintMetricsService {
  constructor(
    @InjectRepository(SprintMetrics)
    private readonly sprintMetricsRepository: Repository<SprintMetrics>,
  ) {}

  async create(createDto: CreateSprintMetricsDto): Promise<SprintMetrics> {
    const metrics = this.sprintMetricsRepository.create(createDto);
    return this.sprintMetricsRepository.save(metrics);
  }

  async findBySprintId(sprintId: number): Promise<SprintMetrics | null> {
    return this.sprintMetricsRepository.findOne({
      where: { sprintId },
      order: { calculatedAt: 'DESC' },
    });
  }

  async findByProjectId(projectId: number): Promise<SprintMetrics[]> {
    return this.sprintMetricsRepository.find({
      where: { projectId },
      order: { calculatedAt: 'DESC' },
    });
  }
}
