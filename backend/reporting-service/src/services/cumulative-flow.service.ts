import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CumulativeFlow } from '../entities/cumulative-flow.entity';
import { CreateCumulativeFlowDto } from '../dto/create-cumulative-flow.dto';

@Injectable()
export class CumulativeFlowService {
  constructor(
    @InjectRepository(CumulativeFlow)
    private readonly cumulativeFlowRepository: Repository<CumulativeFlow>,
  ) {}

  async create(createDto: CreateCumulativeFlowDto): Promise<CumulativeFlow> {
    const flow = this.cumulativeFlowRepository.create(createDto);
    return this.cumulativeFlowRepository.save(flow);
  }

  async findByProjectId(
    projectId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<CumulativeFlow[]> {
    const where: any = { projectId };

    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    }

    return this.cumulativeFlowRepository.find({
      where,
      order: { date: 'ASC' },
    });
  }
}
