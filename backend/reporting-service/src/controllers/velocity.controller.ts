import { Controller, Get, Post, Param, Body, ParseIntPipe, Query } from '@nestjs/common';
import { VelocityService } from '../services/velocity.service';
import { CreateVelocityDto } from '../dto/create-velocity.dto';

@Controller('velocity')
export class VelocityController {
  constructor(private readonly velocityService: VelocityService) {}

  @Post()
  create(@Body() createDto: CreateVelocityDto) {
    return this.velocityService.create(createDto);
  }

  @Get('team/:teamId')
  getByTeamId(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.velocityService.findByTeamId(teamId);
  }

  @Get('team/:teamId/average')
  getAverageVelocity(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('sprints', ParseIntPipe) sprints: number = 3,
  ) {
    return this.velocityService.calculateAverageVelocity(teamId, sprints);
  }
}
