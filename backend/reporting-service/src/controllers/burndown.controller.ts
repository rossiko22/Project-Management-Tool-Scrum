import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { BurndownService } from '../services/burndown.service';
import { CreateBurndownDto } from '../dto/create-burndown.dto';
import { rabbitMQLogger } from '../utils/rabbitmq-logger';

@Controller('burndown')
export class BurndownController {
  constructor(private readonly burndownService: BurndownService) {}

  @Post()
  async create(@Body() createDto: CreateBurndownDto) {
    const url = `/api/burndown`;
    rabbitMQLogger.logInfo(`Creating burndown chart for sprint ${createDto.sprintId}`, url);

    try {
      const result = await this.burndownService.create(createDto);
      rabbitMQLogger.logInfo(`Burndown chart created successfully for sprint ${createDto.sprintId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to create burndown chart for sprint ${createDto.sprintId}: ${error.message}`, url);
      throw error;
    }
  }

  @Get('sprint/:sprintId')
  async getBySprintId(@Param('sprintId', ParseIntPipe) sprintId: number) {
    const url = `/api/burndown/sprint/${sprintId}`;
    rabbitMQLogger.logInfo(`Retrieving burndown chart for sprint ${sprintId}`, url);

    try {
      const result = await this.burndownService.findBySprintId(sprintId);
      rabbitMQLogger.logInfo(`Retrieved ${result.length} burndown data points for sprint ${sprintId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to retrieve burndown chart for sprint ${sprintId}: ${error.message}`, url);
      throw error;
    }
  }

  @Get('project/:projectId')
  async getProjectBurndown(@Param('projectId', ParseIntPipe) projectId: number) {
    const url = `/api/burndown/project/${projectId}`;
    rabbitMQLogger.logInfo(`Retrieving project burndown chart for project ${projectId}`, url);

    try {
      const result = await this.burndownService.getProjectBurndown(projectId);
      rabbitMQLogger.logInfo(`Retrieved ${result.length} burndown data points for project ${projectId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to retrieve project burndown chart: ${error.message}`, url);
      throw error;
    }
  }

  @Post('generate/:sprintId')
  async generateBurndownData(@Param('sprintId', ParseIntPipe) sprintId: number) {
    const url = `/api/burndown/generate/${sprintId}`;
    rabbitMQLogger.logInfo(`Generating burndown data for sprint ${sprintId}`, url);

    try {
      const result = await this.burndownService.generateDailyBurndown(sprintId);
      rabbitMQLogger.logInfo(`Burndown data generated successfully for sprint ${sprintId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to generate burndown data for sprint ${sprintId}: ${error.message}`, url);
      throw error;
    }
  }
}
