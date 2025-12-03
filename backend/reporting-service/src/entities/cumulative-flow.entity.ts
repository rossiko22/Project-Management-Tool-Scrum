import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cumulative_flow')
export class CumulativeFlow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id' })
  projectId: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'todo_count' })
  todoCount: number;

  @Column({ name: 'in_progress_count' })
  inProgressCount: number;

  @Column({ name: 'in_review_count' })
  inReviewCount: number;

  @Column({ name: 'done_count' })
  doneCount: number;
}
