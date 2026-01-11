import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('team_velocity')
export class TeamVelocity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'team_id', type: 'bigint' })
  teamId: number;

  @Column({ name: 'sprint_id', type: 'bigint' })
  sprintId: number;

  @Column({ name: 'sprint_name' })
  sprintName: string;

  @Column()
  velocity: number;

  @Column({ name: 'sprint_end_date', type: 'date' })
  sprintEndDate: Date;

  @CreateDateColumn({ name: 'calculated_at' })
  calculatedAt: Date;
}
