import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('sprint_metrics')
export class SprintMetrics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sprint_id', type: 'bigint' })
  sprintId: number;

  @Column({ name: 'project_id', type: 'bigint' })
  projectId: number;

  @Column({ name: 'team_id', type: 'bigint' })
  teamId: number;

  @Column({ name: 'committed_points', nullable: true })
  committedPoints: number;

  @Column({ name: 'completed_points', nullable: true })
  completedPoints: number;

  @Column({ name: 'carried_over_points', nullable: true })
  carriedOverPoints: number;

  @Column({ nullable: true })
  velocity: number;

  @Column({ name: 'stories_completed', nullable: true })
  storiesCompleted: number;

  @Column({ name: 'stories_carried_over', nullable: true })
  storiesCarriedOver: number;

  @Column({ name: 'bugs_fixed', nullable: true })
  bugsFixed: number;

  @Column({ name: 'impediments_count', nullable: true })
  impedimentsCount: number;

  @Column({ name: 'sprint_start', type: 'date', nullable: true })
  sprintStart: Date;

  @Column({ name: 'sprint_end', type: 'date', nullable: true })
  sprintEnd: Date;

  @CreateDateColumn({ name: 'calculated_at' })
  calculatedAt: Date;
}
