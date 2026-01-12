import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
  ) {}

  async findAll(search?: string, location?: string): Promise<Team[]> {
    const query = this.teamsRepository.createQueryBuilder('team');

    if (search) {
      query.where('team.name ILIKE :search', { search: `%${search}%` });
    }

    if (location) {
      query.andWhere('team.location = :location', { location });
    }

    query.orderBy('team.name', 'ASC');
    return query.getMany();
  }

  async findOne(id: number): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['players'],
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  async create(createTeamDto: CreateTeamDto, logoPath?: string): Promise<Team> {
    const team = this.teamsRepository.create({
      ...createTeamDto,
      logo: logoPath,
    });
    return this.teamsRepository.save(team);
  }

  async update(id: number, updateTeamDto: UpdateTeamDto, logoPath?: string): Promise<Team> {
    const team = await this.findOne(id);
    
    Object.assign(team, updateTeamDto);
    if (logoPath) {
      team.logo = logoPath;
    }

    return this.teamsRepository.save(team);
  }

  async remove(id: number): Promise<void> {
    const team = await this.findOne(id);
    await this.teamsRepository.remove(team);
  }
}
