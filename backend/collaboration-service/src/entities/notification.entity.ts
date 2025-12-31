import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  SPRINT_STARTED = 'SPRINT_STARTED',
  SPRINT_ENDED = 'SPRINT_ENDED',
  MENTION = 'MENTION',
  IMPEDIMENT_REPORTED = 'IMPEDIMENT_REPORTED',
  IMPEDIMENT_RESOLVED = 'IMPEDIMENT_RESOLVED',
  // Developer approval workflow notifications
  BACKLOG_ITEM_APPROVAL_REQUEST = 'BACKLOG_ITEM_APPROVAL_REQUEST',
  BACKLOG_ITEM_APPROVED = 'BACKLOG_ITEM_APPROVED',
  BACKLOG_ITEM_REJECTED = 'BACKLOG_ITEM_REJECTED',
  BACKLOG_ITEM_READY_FOR_SPRINT = 'BACKLOG_ITEM_READY_FOR_SPRINT',
  ITEM_MOVED_TO_REVIEW = 'ITEM_MOVED_TO_REVIEW',
  ITEM_RETURNED_TO_BACKLOG = 'ITEM_RETURNED_TO_BACKLOG',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'recipient_id', type: 'bigint' })
  recipientId: number;

  @Column({ type: 'varchar', length: 50 })
  type: NotificationType;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;
}
