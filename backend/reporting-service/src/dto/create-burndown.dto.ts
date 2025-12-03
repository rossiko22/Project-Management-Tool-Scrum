import { IsNumber, IsPositive, IsDateString, Min } from 'class-validator';

export class CreateBurndownDto {
  @IsNumber()
  @IsPositive()
  sprintId: number;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  remainingStoryPoints: number;

  @IsNumber()
  @Min(0)
  remainingTasks: number;

  @IsNumber()
  @Min(0)
  remainingHours: number;

  @IsNumber()
  @Min(0)
  idealRemaining: number;
}
