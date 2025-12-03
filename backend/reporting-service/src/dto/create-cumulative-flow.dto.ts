import { IsNumber, IsPositive, IsDateString, Min } from 'class-validator';

export class CreateCumulativeFlowDto {
  @IsNumber()
  @IsPositive()
  projectId: number;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  todoCount: number;

  @IsNumber()
  @Min(0)
  inProgressCount: number;

  @IsNumber()
  @Min(0)
  inReviewCount: number;

  @IsNumber()
  @Min(0)
  doneCount: number;
}
