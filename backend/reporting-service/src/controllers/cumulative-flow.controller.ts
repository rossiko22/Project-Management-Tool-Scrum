import { Controller, Get, Post, Param, Body, ParseIntPipe, Query } from '@nestjs/common';
import { CumulativeFlowService } from '../services/cumulative-flow.service';
import { CreateCumulativeFlowDto } from '../dto/create-cumulative-flow.dto';

@Controller('cumulative-flow')
export class CumulativeFlowController {
  constructor(private readonly cumulativeFlowService: CumulativeFlowService) {}

  @Post()
  create(@Body() createDto: CreateCumulativeFlowDto) {
    return this.cumulativeFlowService.create(createDto);
  }

  @Get('project/:projectId')
  getByProjectId(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cumulativeFlowService.findByProjectId(projectId, startDate, endDate);
  }
}
