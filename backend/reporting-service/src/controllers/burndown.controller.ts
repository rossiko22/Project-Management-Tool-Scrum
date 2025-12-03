import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { BurndownService } from '../services/burndown.service';
import { CreateBurndownDto } from '../dto/create-burndown.dto';

@Controller('burndown')
export class BurndownController {
  constructor(private readonly burndownService: BurndownService) {}

  @Post()
  create(@Body() createDto: CreateBurndownDto) {
    return this.burndownService.create(createDto);
  }

  @Get('sprint/:sprintId')
  getBySprintId(@Param('sprintId', ParseIntPipe) sprintId: number) {
    return this.burndownService.findBySprintId(sprintId);
  }

  @Post('generate/:sprintId')
  generateBurndownData(@Param('sprintId', ParseIntPipe) sprintId: number) {
    return this.burndownService.generateDailyBurndown(sprintId);
  }
}
