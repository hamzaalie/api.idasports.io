import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './entities/match.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
  ) {}

  async findAll(status?: string, teamId?: number, competition?: string): Promise<Match[]> {
    const query = this.matchesRepository.createQueryBuilder('match')
      .leftJoinAndSelect('match.home_team', 'home_team')
      .leftJoinAndSelect('match.away_team', 'away_team')
      .leftJoinAndSelect('match.created_by', 'created_by');

    if (status) {
      query.where('match.status = :status', { status });
    }

    if (teamId) {
      query.andWhere('(match.home_team_id = :teamId OR match.away_team_id = :teamId)', { teamId });
    }

    if (competition) {
      query.andWhere('match.competition ILIKE :competition', { competition: `%${competition}%` });
    }

    query.orderBy('match.match_date', 'DESC');
    return query.getMany();
  }

  async findOne(id: number): Promise<Match> {
    const match = await this.matchesRepository.findOne({ 
      where: { id },
      relations: ['home_team', 'away_team', 'created_by'],
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return match;
  }

  async create(createMatchDto: CreateMatchDto): Promise<Match> {
    // Validate that home and away teams are different
    if (createMatchDto.home_team_id === createMatchDto.away_team_id) {
      throw new BadRequestException('Home and away teams must be different');
    }

    const match = this.matchesRepository.create(createMatchDto);
    return this.matchesRepository.save(match);
  }

  async update(id: number, updateMatchDto: UpdateMatchDto): Promise<Match> {
    const match = await this.findOne(id);
    
    // Validate that home and away teams are different if both are being updated
    if (updateMatchDto.home_team_id && updateMatchDto.away_team_id) {
      if (updateMatchDto.home_team_id === updateMatchDto.away_team_id) {
        throw new BadRequestException('Home and away teams must be different');
      }
    }
    
    Object.assign(match, updateMatchDto);
    return this.matchesRepository.save(match);
  }

  async remove(id: number): Promise<void> {
    const match = await this.findOne(id);
    await this.matchesRepository.remove(match);
  }
}
