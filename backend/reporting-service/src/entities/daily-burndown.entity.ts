import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('daily_burndown')
export class DailyBurndown {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sprint_id', type: 'bigint' })
  sprintId: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'remaining_points' })
  remainingPoints: number;

  @Column({ name: 'ideal_remaining_points' })
  idealRemainingPoints: number;

  @Column({ name: 'completed_points', nullable: true })
  completedPoints: number;

  @Column({ name: 'added_points', nullable: true })
  addedPoints: number;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;
}
