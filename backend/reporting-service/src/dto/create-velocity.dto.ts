import { IsNumber, IsPositive, Min, Max } from 'class-validator';

export class CreateVelocityDto {
  @IsNumber()
  @IsPositive()
  teamId: number;

  @IsNumber()
  @IsPositive()
  sprintId: number;

  @IsNumber()
  @IsPositive()
  sprintNumber: number;

  @IsNumber()
  @Min(0)
  completedStoryPoints: number;

  @IsNumber()
  @Min(0)
  committedStoryPoints: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage: number;
}
