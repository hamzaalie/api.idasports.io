import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerStats } from './entities/player-stats.entity';
import { CreatePlayerStatsDto } from './dto/create-player-stats.dto';
import { UpdatePlayerStatsDto } from './dto/update-player-stats.dto';

@Injectable()
export class PlayerStatsService {
  constructor(
    @InjectRepository(PlayerStats)
    private playerStatsRepository: Repository<PlayerStats>,
  ) {}

  async findAll(playerId?: number, matchId?: number): Promise<PlayerStats[]> {
    const query = this.playerStatsRepository.createQueryBuilder('stats')
      .leftJoinAndSelect('stats.player', 'player')
      .leftJoinAndSelect('stats.match', 'match')
      .leftJoinAndSelect('match.home_team', 'home_team')
      .leftJoinAndSelect('match.away_team', 'away_team');

    if (playerId) {
      query.andWhere('stats.player_id = :playerId', { playerId });
    }

    if (matchId) {
      query.andWhere('stats.match_id = :matchId', { matchId });
    }

    query.orderBy('match.match_date', 'DESC');
    return query.getMany();
  }

  async findOne(id: number): Promise<PlayerStats> {
    const stats = await this.playerStatsRepository.findOne({
      where: { id },
      relations: ['player', 'player.user', 'match', 'match.home_team', 'match.away_team'],
    });

    if (!stats) {
      throw new NotFoundException(`Player stats with ID ${id} not found`);
    }

    return stats;
  }

  async findByPlayerAndMatch(playerId: number, matchId: number): Promise<PlayerStats | null> {
    return this.playerStatsRepository.findOne({
      where: { player_id: playerId, match_id: matchId },
      relations: ['player', 'match'],
    });
  }

  async create(createPlayerStatsDto: CreatePlayerStatsDto): Promise<PlayerStats> {
    // Check if stats already exist for this player and match
    const existing = await this.findByPlayerAndMatch(
      createPlayerStatsDto.player_id,
      createPlayerStatsDto.match_id,
    );

    if (existing) {
      throw new ConflictException(
        `Stats already exist for player ${createPlayerStatsDto.player_id} in match ${createPlayerStatsDto.match_id}`,
      );
    }

    const stats = this.playerStatsRepository.create(createPlayerStatsDto);
    return this.playerStatsRepository.save(stats);
  }

  async update(id: number, updatePlayerStatsDto: UpdatePlayerStatsDto): Promise<PlayerStats> {
    const stats = await this.findOne(id);
    Object.assign(stats, updatePlayerStatsDto);
    return this.playerStatsRepository.save(stats);
  }

  async remove(id: number): Promise<void> {
    const stats = await this.findOne(id);
    await this.playerStatsRepository.remove(stats);
  }

  // Calculate aggregate stats for a player across all matches
  async getPlayerAggregateStats(playerId: number) {
    const allStats = await this.findAll(playerId);
    
    return {
      total_matches: allStats.length,
      total_minutes: allStats.reduce((sum, s) => sum + s.minutes_played, 0),
      total_goals: allStats.reduce((sum, s) => sum + s.goals, 0),
      total_assists: allStats.reduce((sum, s) => sum + s.assists, 0),
      total_shots: allStats.reduce((sum, s) => sum + s.shots, 0),
      total_shots_on_target: allStats.reduce((sum, s) => sum + s.shots_on_target, 0),
      total_passes_completed: allStats.reduce((sum, s) => sum + s.passes_completed, 0),
      avg_pass_accuracy: allStats.length > 0 
        ? allStats.reduce((sum, s) => sum + Number(s.pass_accuracy), 0) / allStats.length 
        : 0,
      total_tackles: allStats.reduce((sum, s) => sum + s.tackles, 0),
      total_yellow_cards: allStats.reduce((sum, s) => sum + s.yellow_cards, 0),
      total_red_cards: allStats.reduce((sum, s) => sum + s.red_cards, 0),
    };
  }
}
