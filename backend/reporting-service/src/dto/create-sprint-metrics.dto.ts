import { IsNumber, IsPositive, Min } from 'class-validator';

export class CreateSprintMetricsDto {
  @IsNumber()
  @IsPositive()
  sprintId: number;

  @IsNumber()
  @IsPositive()
  projectId: number;

  @IsNumber()
  @Min(0)
  totalStoryPoints: number;

  @IsNumber()
  @Min(0)
  completedStoryPoints: number;

  @IsNumber()
  @Min(0)
  totalTasks: number;

  @IsNumber()
  @Min(0)
  completedTasks: number;

  @IsNumber()
  @Min(0)
  plannedHours: number;

  @IsNumber()
  @Min(0)
  actualHours: number;

  @IsNumber()
  @Min(0)
  bugsFound: number;

  @IsNumber()
  @Min(0)
  bugsFixed: number;
}
