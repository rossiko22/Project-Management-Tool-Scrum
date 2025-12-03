import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('team_velocity')
export class TeamVelocity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'team_id' })
  teamId: number;

  @Column({ name: 'sprint_id' })
  sprintId: number;

  @Column({ name: 'sprint_number' })
  sprintNumber: number;

  @Column({ name: 'completed_story_points' })
  completedStoryPoints: number;

  @Column({ name: 'committed_story_points' })
  committedStoryPoints: number;

  @Column({ name: 'completion_percentage', type: 'decimal', precision: 5, scale: 2 })
  completionPercentage: number;

  @CreateDateColumn({ name: 'calculated_at' })
  calculatedAt: Date;
}
