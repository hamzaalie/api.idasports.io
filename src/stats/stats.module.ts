import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerStats } from './entities/player-stats.entity';
import { TeamMatchStats } from './entities/team-match-stats.entity';
import { PlayerStatsService } from './player-stats.service';
import { TeamMatchStatsService } from './team-match-stats.service';
import { PlayerStatsController } from './player-stats.controller';
import { TeamMatchStatsController } from './team-match-stats.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerStats, TeamMatchStats])],
  controllers: [PlayerStatsController, TeamMatchStatsController],
  providers: [PlayerStatsService, TeamMatchStatsService],
  exports: [PlayerStatsService, TeamMatchStatsService],
})
export class StatsModule {}
