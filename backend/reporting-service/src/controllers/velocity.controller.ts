import { Controller, Get, Post, Param, Body, ParseIntPipe, Query } from '@nestjs/common';
import { VelocityService } from '../services/velocity.service';
import { CreateVelocityDto } from '../dto/create-velocity.dto';
import { rabbitMQLogger } from '../utils/rabbitmq-logger';

@Controller('velocity')
export class VelocityController {
  constructor(private readonly velocityService: VelocityService) {}

  @Post()
  async create(@Body() createDto: CreateVelocityDto) {
    const url = `/api/velocity`;
    rabbitMQLogger.logInfo(`Creating velocity record for sprint ${createDto.sprintId}`, url);

    try {
      const result = await this.velocityService.create(createDto);
      rabbitMQLogger.logInfo(`Velocity record created successfully for sprint ${createDto.sprintId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to create velocity record: ${error.message}`, url);
      throw error;
    }
  }

  @Get('team/:teamId')
  async getByTeamId(@Param('teamId', ParseIntPipe) teamId: number) {
    const url = `/api/velocity/team/${teamId}`;
    rabbitMQLogger.logInfo(`Retrieving velocity data for team ${teamId}`, url);

    try {
      const result = await this.velocityService.findByTeamId(teamId);
      rabbitMQLogger.logInfo(`Retrieved ${result.length} velocity records for team ${teamId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to retrieve velocity data for team ${teamId}: ${error.message}`, url);
      throw error;
    }
  }

  @Get('team/:teamId/average')
  async getAverageVelocity(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('sprints', ParseIntPipe) sprints: number = 3,
  ) {
    const url = `/api/velocity/team/${teamId}/average`;
    rabbitMQLogger.logInfo(`Calculating average velocity for team ${teamId} over ${sprints} sprints`, url);

    try {
      const result = await this.velocityService.calculateAverageVelocity(teamId, sprints);
      rabbitMQLogger.logInfo(`Average velocity calculated for team ${teamId}: ${result.averageVelocity}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to calculate average velocity for team ${teamId}: ${error.message}`, url);
      throw error;
    }
  }
}
