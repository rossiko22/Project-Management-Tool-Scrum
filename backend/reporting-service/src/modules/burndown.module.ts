import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyBurndown } from '../entities/daily-burndown.entity';
import { ProjectBurndown } from '../entities/project-burndown.entity';
import { BurndownController } from '../controllers/burndown.controller';
import { BurndownService } from '../services/burndown.service';

@Module({
  imports: [TypeOrmModule.forFeature([DailyBurndown, ProjectBurndown])],
  controllers: [BurndownController],
  providers: [BurndownService],
  exports: [BurndownService],
})
export class BurndownModule {}
