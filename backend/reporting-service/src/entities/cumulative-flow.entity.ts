import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('cumulative_flow')
export class CumulativeFlow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sprint_id', type: 'bigint' })
  sprintId: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'to_do_count', default: 0 })
  toDoCount: number;

  @Column({ name: 'in_progress_count', default: 0 })
  inProgressCount: number;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ name: 'done_count', default: 0 })
  doneCount: number;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;
}
