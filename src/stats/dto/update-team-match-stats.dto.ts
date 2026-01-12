import { PartialType } from '@nestjs/mapped-types';
import { CreateTeamMatchStatsDto } from './create-team-match-stats.dto';

export class UpdateTeamMatchStatsDto extends PartialType(CreateTeamMatchStatsDto) {}
