import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './entities/player.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
  ) {}

  async findAll(search?: string, teamId?: number, position?: string): Promise<Player[]> {
    const query = this.playersRepository.createQueryBuilder('player')
      .leftJoinAndSelect('player.team', 'team');

    if (search) {
      query.where('player.name ILIKE :search', { search: `%${search}%` });
    }

    if (teamId) {
      query.andWhere('player.team_id = :teamId', { teamId });
    }

    if (position) {
      query.andWhere('player.position = :position', { position });
    }

    query.orderBy('player.name', 'ASC');
    return query.getMany();
  }

  async findOne(id: number): Promise<Player> {
    const player = await this.playersRepository.findOne({
      where: { id },
      relations: ['team', 'user'],
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return player;
  }

  async create(data: Partial<Player>, photoPath?: string): Promise<Player> {
    const player = this.playersRepository.create({
      ...data,
      photo: photoPath,
    });
    return this.playersRepository.save(player);
  }

  async update(id: number, data: Partial<Player>, photoPath?: string): Promise<Player> {
    const player = await this.findOne(id);
    
    Object.assign(player, data);
    if (photoPath) {
      player.photo = photoPath;
    }

    return this.playersRepository.save(player);
  }

  async remove(id: number): Promise<void> {
    const player = await this.findOne(id);
    await this.playersRepository.remove(player);
  }
}
