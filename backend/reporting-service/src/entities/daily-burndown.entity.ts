import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('daily_burndown')
export class DailyBurndown {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sprint_id' })
  sprintId: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'remaining_story_points' })
  remainingStoryPoints: number;

  @Column({ name: 'remaining_tasks' })
  remainingTasks: number;

  @Column({ name: 'remaining_hours', type: 'decimal', precision: 10, scale: 2 })
  remainingHours: number;

  @Column({ name: 'ideal_remaining', type: 'decimal', precision: 10, scale: 2 })
  idealRemaining: number;
}
