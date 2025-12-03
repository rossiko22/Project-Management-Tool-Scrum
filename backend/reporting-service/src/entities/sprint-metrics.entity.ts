import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('sprint_metrics')
export class SprintMetrics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sprint_id' })
  sprintId: number;

  @Column({ name: 'project_id' })
  projectId: number;

  @Column({ name: 'total_story_points' })
  totalStoryPoints: number;

  @Column({ name: 'completed_story_points' })
  completedStoryPoints: number;

  @Column({ name: 'total_tasks' })
  totalTasks: number;

  @Column({ name: 'completed_tasks' })
  completedTasks: number;

  @Column({ name: 'planned_hours', type: 'decimal', precision: 10, scale: 2 })
  plannedHours: number;

  @Column({ name: 'actual_hours', type: 'decimal', precision: 10, scale: 2 })
  actualHours: number;

  @Column({ name: 'bugs_found' })
  bugsFound: number;

  @Column({ name: 'bugs_fixed' })
  bugsFixed: number;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;
}
