import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment, EntityType } from '../entities/comment.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async createComment(
    authorId: number,
    entityType: EntityType,
    entityId: number,
    content: string,
    parentCommentId?: number,
  ): Promise<Comment> {
    const comment = this.commentRepository.create({
      authorId,
      entityType,
      entityId,
      content,
      parentCommentId,
    });
    return this.commentRepository.save(comment);
  }

  async getCommentsByEntity(
    entityType: EntityType,
    entityId: number,
  ): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { entityType, entityId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  async updateComment(id: number, content: string): Promise<Comment | null> {
    await this.commentRepository.update(id, { content });
    return this.commentRepository.findOne({ where: { id } });
  }

  async softDeleteComment(id: number): Promise<void> {
    await this.commentRepository.update(id, { deletedAt: new Date() });
  }
}
