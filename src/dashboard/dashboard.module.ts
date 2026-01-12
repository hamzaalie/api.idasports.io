import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { TeamsModule } from '../teams/teams.module';
import { PlayersModule } from '../players/players.module';
import { MatchesModule } from '../matches/matches.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TeamsModule, PlayersModule, MatchesModule, UsersModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
