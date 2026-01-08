import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { CommentService } from '../services/comment.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { EntityType } from '../entities/comment.entity';
import { rabbitMQLogger } from '../utils/rabbitmq-logger';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post()
  async createComment(
    @Body() body: { entityType: EntityType; entityId: number; content: string; parentCommentId?: number },
    @Request() req,
  ) {
    const url = `/comments`;
    rabbitMQLogger.logInfo(`Creating comment on ${body.entityType} ${body.entityId} by user ${req.user.userId}`, url);

    try {
      const result = await this.commentService.createComment(
        req.user.userId,
        body.entityType,
        body.entityId,
        body.content,
        body.parentCommentId,
      );
      rabbitMQLogger.logInfo(`Comment created successfully with ID ${result.id}`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to create comment: ${error.message}`, url);
      throw error;
    }
  }

  @Get('thread/:entityType/:entityId')
  async getCommentThread(
    @Param('entityType') entityType: EntityType,
    @Param('entityId') entityId: number,
  ) {
    const url = `/comments/thread/${entityType}/${entityId}`;
    rabbitMQLogger.logInfo(`Retrieving comments for ${entityType} ${entityId}`, url);

    try {
      const result = await this.commentService.getCommentsByEntity(entityType, entityId);
      rabbitMQLogger.logInfo(`Retrieved ${result.length} comments`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to retrieve comments: ${error.message}`, url);
      throw error;
    }
  }

  @Put(':id')
  async updateComment(
    @Param('id') id: number,
    @Body() body: { content: string },
  ) {
    const url = `/comments/${id}`;
    rabbitMQLogger.logInfo(`Updating comment ${id}`, url);

    try {
      const result = await this.commentService.updateComment(id, body.content);
      rabbitMQLogger.logInfo(`Comment ${id} updated successfully`, url);
      return result;
    } catch (error) {
      rabbitMQLogger.logError(`Failed to update comment ${id}: ${error.message}`, url);
      throw error;
    }
  }

  @Delete(':id')
  async deleteComment(@Param('id') id: number) {
    const url = `/comments/${id}`;
    rabbitMQLogger.logInfo(`Deleting comment ${id}`, url);

    try {
      await this.commentService.softDeleteComment(id);
      rabbitMQLogger.logInfo(`Comment ${id} deleted successfully`, url);
      return { message: 'Comment deleted successfully' };
    } catch (error) {
      rabbitMQLogger.logError(`Failed to delete comment ${id}: ${error.message}`, url);
      throw error;
    }
  }
}
