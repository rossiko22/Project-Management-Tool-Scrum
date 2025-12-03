import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyBurndown } from '../entities/daily-burndown.entity';
import { CreateBurndownDto } from '../dto/create-burndown.dto';

@Injectable()
export class BurndownService {
  constructor(
    @InjectRepository(DailyBurndown)
    private readonly burndownRepository: Repository<DailyBurndown>,
  ) {}

  async create(createDto: CreateBurndownDto): Promise<DailyBurndown> {
    const burndown = this.burndownRepository.create(createDto);
    return this.burndownRepository.save(burndown);
  }

  async findBySprintId(sprintId: number): Promise<DailyBurndown[]> {
    return this.burndownRepository.find({
      where: { sprintId },
      order: { date: 'ASC' },
    });
  }

  async generateDailyBurndown(sprintId: number): Promise<{ message: string }> {
    return {
      message: `Burndown data generation triggered for sprint ${sprintId}`,
    };
  }
}
