import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ActivityLogService } from '../services/activity-log.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private activityLogService: ActivityLogService) {}

  @Get('project/:projectId')
  async getProjectActivity(
    @Param('projectId') projectId: number,
    @Query('limit') limit?: number,
  ) {
    return this.activityLogService.getProjectActivityLogs(projectId, limit);
  }

  @Get('user/:userId')
  async getUserActivity(
    @Param('userId') userId: number,
    @Query('limit') limit?: number,
  ) {
    return this.activityLogService.getUserActivityLogs(userId, limit);
  }
}
