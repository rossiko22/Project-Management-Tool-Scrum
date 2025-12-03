import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { SprintMetricsService } from '../services/sprint-metrics.service';
import { CreateSprintMetricsDto } from '../dto/create-sprint-metrics.dto';

@Controller('sprint-metrics')
export class SprintMetricsController {
  constructor(private readonly sprintMetricsService: SprintMetricsService) {}

  @Post()
  create(@Body() createDto: CreateSprintMetricsDto) {
    return this.sprintMetricsService.create(createDto);
  }

  @Get('sprint/:sprintId')
  getBySprintId(@Param('sprintId', ParseIntPipe) sprintId: number) {
    return this.sprintMetricsService.findBySprintId(sprintId);
  }

  @Get('project/:projectId')
  getByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.sprintMetricsService.findByProjectId(projectId);
  }
}
