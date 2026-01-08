import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ActivityLogService } from '../services/activity-log.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { rabbitMQLogger } from '../utils/rabbitmq-logger';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private activityLogService: ActivityLogService) {}

  @Get('project/:projectId')
  async getProjectActivity(
    @Param('projectId') projectId: number,
    @Query('limit') limit?: number,
  ) {
    const url = `/activity/project/${projectId}`;
    rabbitMQLogger.logInfo(`Retrieving activity logs for project ${projectId}`, url);

    try {
      const result = await this.activityLogService.getProjectActivityLogs(projectId, limit);
      rabbitMQLogger.logInfo(`Retrieved ${result.length} activity logs for project ${projectId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to retrieve activity logs for project ${projectId}: ${error.message}`, url);
      throw error;
    }
  }

  @Get('user/:userId')
  async getUserActivity(
    @Param('userId') userId: number,
    @Query('limit') limit?: number,
  ) {
    const url = `/activity/user/${userId}`;
    rabbitMQLogger.logInfo(`Retrieving activity logs for user ${userId}`, url);

    try {
      const result = await this.activityLogService.getUserActivityLogs(userId, limit);
      rabbitMQLogger.logInfo(`Retrieved ${result.length} activity logs for user ${userId}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to retrieve activity logs for user ${userId}: ${error.message}`, url);
      throw error;
    }
  }
}
