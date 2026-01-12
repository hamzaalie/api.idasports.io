import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamsService } from '../teams/teams.service';
import { PlayersService } from '../players/players.service';
import { MatchesService } from '../matches/matches.service';
import { UsersService } from '../users/users.service';

export interface DashboardStats {
  total_players: number;
  total_teams: number;
  total_matches: number;
  active_scouts: number;
  players_this_month: number;
  teams_this_month: number;
  matches_this_week: number;
  scouts_this_month: number;
  goals_over_time?: any[];
  user_growth?: any[];
  match_activity?: any[];
  top_teams_by_goals?: any[];
  recent_activities?: any[];
  performance_metrics?: any;
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly playersService: PlayersService,
    private readonly matchesService: MatchesService,
    private readonly usersService: UsersService,
  ) {}

  @Get('stats')
  async getStats(): Promise<DashboardStats> {
    // Get all data
    const [teams, players, matches, users] = await Promise.all([
      this.teamsService.findAll(),
      this.playersService.findAll(),
      this.matchesService.findAll(),
      this.usersService.findAll(),
    ]);

    // Calculate month/week boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Count this month's data
    const playersThisMonth = players.filter(
      (p) => p.created_at && new Date(p.created_at) >= monthStart,
    ).length;
    const teamsThisMonth = teams.filter(
      (t) => t.created_at && new Date(t.created_at) >= monthStart,
    ).length;
    const matchesThisWeek = matches.filter(
      (m) => m.created_at && new Date(m.created_at) >= weekStart,
    ).length;

    // Count scouts (subscribers who are not admins)
    const scouts = users.filter((u) => 
      u.roles?.some((role) => 
        role.role === 'subscriber' || role.role === 'limited_user'
      ) && !u.roles?.some((role) => 
        role.role === 'super_admin' || 
        role.role === 'support_admin' || 
        role.role === 'read_only_admin'
      )
    );
    const scoutsThisMonth = scouts.filter(
      (u) => u.created_at && new Date(u.created_at) >= monthStart,
    ).length;

    return {
      total_players: players.length,
      total_teams: teams.length,
      total_matches: matches.length,
      active_scouts: scouts.length,
      players_this_month: playersThisMonth,
      teams_this_month: teamsThisMonth,
      matches_this_week: matchesThisWeek,
      scouts_this_month: scoutsThisMonth,
      goals_over_time: [],
      user_growth: [],
      match_activity: [],
      top_teams_by_goals: [],
      recent_activities: [],
      performance_metrics: {
        average_goals_per_match: 0,
        average_players_per_team: teams.length > 0 ? players.length / teams.length : 0,
        most_active_team: null,
        top_scorer: null,
        top_scorer_goals: 0,
      },
    };
  }
}
