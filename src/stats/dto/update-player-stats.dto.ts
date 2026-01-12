import { PartialType } from '@nestjs/mapped-types';
import { CreatePlayerStatsDto } from './create-player-stats.dto';

export class UpdatePlayerStatsDto extends PartialType(CreatePlayerStatsDto) {}
