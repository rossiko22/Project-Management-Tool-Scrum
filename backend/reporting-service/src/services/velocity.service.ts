import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamVelocity } from '../entities/team-velocity.entity';
import { CreateVelocityDto } from '../dto/create-velocity.dto';

@Injectable()
export class VelocityService {
  constructor(
    @InjectRepository(TeamVelocity)
    private readonly velocityRepository: Repository<TeamVelocity>,
  ) {}

  async create(createDto: CreateVelocityDto): Promise<TeamVelocity> {
    const velocity = this.velocityRepository.create(createDto);
    return this.velocityRepository.save(velocity);
  }

  async findByTeamId(teamId: number): Promise<TeamVelocity[]> {
    return this.velocityRepository.find({
      where: { teamId },
      order: { sprintNumber: 'ASC' },
    });
  }

  async calculateAverageVelocity(
    teamId: number,
    lastNSprints: number,
  ): Promise<{ averageVelocity: number; sprints: TeamVelocity[] }> {
    const sprints = await this.velocityRepository.find({
      where: { teamId },
      order: { sprintNumber: 'DESC' },
      take: lastNSprints,
    });

    const averageVelocity =
      sprints.length > 0
        ? sprints.reduce((sum, s) => sum + s.completedStoryPoints, 0) / sprints.length
        : 0;

    return {
      averageVelocity: Math.round(averageVelocity * 100) / 100,
      sprints: sprints.reverse(),
    };
  }
}
