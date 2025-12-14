import { IsNumber, IsPositive, Min, IsOptional, IsDateString } from 'class-validator';

export class CreateSprintMetricsDto {
  @IsNumber()
  @IsPositive()
  sprintId: number;

  @IsNumber()
  @IsPositive()
  projectId: number;

  @IsNumber()
  @IsPositive()
  teamId: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  committedPoints?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  completedPoints?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  carriedOverPoints?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  velocity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  storiesCompleted?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  storiesCarriedOver?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  bugsFixed?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  impedimentsCount?: number;

  @IsDateString()
  @IsOptional()
  sprintStart?: Date;

  @IsDateString()
  @IsOptional()
  sprintEnd?: Date;
}
