import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMatchStats } from './entities/team-match-stats.entity';
import { CreateTeamMatchStatsDto } from './dto/create-team-match-stats.dto';
import { UpdateTeamMatchStatsDto } from './dto/update-team-match-stats.dto';

@Injectable()
export class TeamMatchStatsService {
  constructor(
    @InjectRepository(TeamMatchStats)
    private teamMatchStatsRepository: Repository<TeamMatchStats>,
  ) {}

  async findAll(teamId?: number, matchId?: number): Promise<TeamMatchStats[]> {
    const query = this.teamMatchStatsRepository.createQueryBuilder('stats')
      .leftJoinAndSelect('stats.team', 'team')
      .leftJoinAndSelect('stats.match', 'match')
      .leftJoinAndSelect('match.home_team', 'home_team')
      .leftJoinAndSelect('match.away_team', 'away_team');

    if (teamId) {
      query.andWhere('stats.team_id = :teamId', { teamId });
    }

    if (matchId) {
      query.andWhere('stats.match_id = :matchId', { matchId });
    }

    query.orderBy('match.match_date', 'DESC');
    return query.getMany();
  }

  async findOne(id: number): Promise<TeamMatchStats> {
    const stats = await this.teamMatchStatsRepository.findOne({
      where: { id },
      relations: ['team', 'match', 'match.home_team', 'match.away_team'],
    });

    if (!stats) {
      throw new NotFoundException(`Team match stats with ID ${id} not found`);
    }

    return stats;
  }

  async create(createTeamMatchStatsDto: CreateTeamMatchStatsDto): Promise<TeamMatchStats> {
    const stats = this.teamMatchStatsRepository.create(createTeamMatchStatsDto);
    return this.teamMatchStatsRepository.save(stats);
  }

  async update(id: number, updateTeamMatchStatsDto: UpdateTeamMatchStatsDto): Promise<TeamMatchStats> {
    const stats = await this.findOne(id);
    Object.assign(stats, updateTeamMatchStatsDto);
    return this.teamMatchStatsRepository.save(stats);
  }

  async remove(id: number): Promise<void> {
    const stats = await this.findOne(id);
    await this.teamMatchStatsRepository.remove(stats);
  }
}
