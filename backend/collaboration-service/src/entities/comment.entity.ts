import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

export enum EntityType {
  BACKLOG_ITEM = 'BACKLOG_ITEM',
  TASK = 'TASK',
  SPRINT = 'SPRINT',
  IMPEDIMENT = 'IMPEDIMENT',
}

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'author_id', type: 'bigint' })
  authorId: number;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType: EntityType;

  @Column({ name: 'entity_id', type: 'bigint' })
  entityId: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'parent_comment_id', type: 'bigint', nullable: true })
  parentCommentId: number;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment: Comment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
