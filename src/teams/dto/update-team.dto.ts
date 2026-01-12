import { PartialType } from '@nestjs/mapped-types';
import { CreateTeamDto } from './create-team.dto';

/**
 * DTO for updating an existing team
 * Extends CreateTeamDto with all fields optional
 */
export class UpdateTeamDto extends PartialType(CreateTeamDto) {}
