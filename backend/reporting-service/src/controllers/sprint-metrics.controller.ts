import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { SprintMetricsService } from '../services/sprint-metrics.service';
import { CreateSprintMetricsDto } from '../dto/create-sprint-metrics.dto';
import { rabbitMQLogger } from '../utils/rabbitmq-logger';

@Controller('sprint-metrics')
export class SprintMetricsController {
  constructor(private readonly sprintMetricsService: SprintMetricsService) {}

  @Post()
  async create(@Body() createDto: CreateSprintMetricsDto) {
    const url = `/api/sprint-metrics`;
    rabbitMQLogger.logInfo(`Creating sprint metrics for sprint ${createDto.sprintId}`, url);

    try {
      const result = await this.sprintMetricsService.create(createDto);
      rabbitMQLogger.logInfo(`Sprint metrics created successfully for sprint ${createDto.sprintId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to create sprint metrics: ${error.message}`, url);
      throw error;
    }
  }

  @Get('sprint/:sprintId')
  async getBySprintId(@Param('sprintId', ParseIntPipe) sprintId: number) {
    const url = `/api/sprint-metrics/sprint/${sprintId}`;
    rabbitMQLogger.logInfo(`Retrieving sprint metrics for sprint ${sprintId}`, url);

    try {
      const result = await this.sprintMetricsService.findBySprintId(sprintId);
      rabbitMQLogger.logInfo(`Sprint metrics retrieved for sprint ${sprintId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to retrieve sprint metrics for sprint ${sprintId}: ${error.message}`, url);
      throw error;
    }
  }

  @Get('project/:projectId')
  async getByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    const url = `/api/sprint-metrics/project/${projectId}`;
    rabbitMQLogger.logInfo(`Retrieving sprint metrics for project ${projectId}`, url);

    try {
      const result = await this.sprintMetricsService.findByProjectId(projectId);
      rabbitMQLogger.logInfo(`Retrieved ${result.length} sprint metrics for project ${projectId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to retrieve sprint metrics for project ${projectId}: ${error.message}`, url);
      throw error;
    }
  }
}
