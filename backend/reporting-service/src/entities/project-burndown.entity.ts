import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('project_burndown')
export class ProjectBurndown {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'bigint' })
  projectId: number;

  @Column({ name: 'sprint_id', type: 'bigint' })
  sprintId: number;

  @Column({ name: 'sprint_number' })
  sprintNumber: number;

  @Column({ name: 'sprint_name' })
  sprintName: string;

  @Column({ name: 'backlog_items_remaining' })
  backlogItemsRemaining: number;

  @Column({ name: 'items_completed_in_sprint' })
  itemsCompletedInSprint: number;

  @Column({ name: 'completed_points' })
  completedPoints: number;

  @Column({ name: 'sprint_end_date', type: 'date' })
  sprintEndDate: Date;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;
}
