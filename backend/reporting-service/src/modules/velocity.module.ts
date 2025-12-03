import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamVelocity } from '../entities/team-velocity.entity';
import { VelocityController } from '../controllers/velocity.controller';
import { VelocityService } from '../services/velocity.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamVelocity])],
  controllers: [VelocityController],
  providers: [VelocityService],
  exports: [VelocityService],
})
export class VelocityModule {}
