import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CumulativeFlow } from '../entities/cumulative-flow.entity';
import { CumulativeFlowController } from '../controllers/cumulative-flow.controller';
import { CumulativeFlowService } from '../services/cumulative-flow.service';

@Module({
  imports: [TypeOrmModule.forFeature([CumulativeFlow])],
  controllers: [CumulativeFlowController],
  providers: [CumulativeFlowService],
  exports: [CumulativeFlowService],
})
export class CumulativeFlowModule {}
