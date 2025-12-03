import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { CommentService } from '../services/comment.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { EntityType } from '../entities/comment.entity';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post()
  async createComment(
    @Body() body: { entityType: EntityType; entityId: number; content: string; parentCommentId?: number },
    @Request() req,
  ) {
    return this.commentService.createComment(
      req.user.userId,
      body.entityType,
      body.entityId,
      body.content,
      body.parentCommentId,
    );
  }

  @Get('thread/:entityType/:entityId')
  async getCommentThread(
    @Param('entityType') entityType: EntityType,
    @Param('entityId') entityId: number,
  ) {
    return this.commentService.getCommentsByEntity(entityType, entityId);
  }

  @Put(':id')
  async updateComment(
    @Param('id') id: number,
    @Body() body: { content: string },
  ) {
    return this.commentService.updateComment(id, body.content);
  }

  @Delete(':id')
  async deleteComment(@Param('id') id: number) {
    await this.commentService.softDeleteComment(id);
    return { message: 'Comment deleted successfully' };
  }
}
