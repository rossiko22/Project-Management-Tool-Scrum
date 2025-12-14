import { IsNumber, IsPositive, Min, IsDateString } from 'class-validator';

export class CreateVelocityDto {
  @IsNumber()
  @IsPositive()
  teamId: number;

  @IsNumber()
  @IsPositive()
  sprintId: number;

  @IsNumber()
  @Min(0)
  velocity: number;

  @IsDateString()
  sprintEndDate: Date;
}
