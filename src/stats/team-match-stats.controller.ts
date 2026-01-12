import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.entity';
import { TeamMatchStatsService } from './team-match-stats.service';
import { CreateTeamMatchStatsDto } from './dto/create-team-match-stats.dto';
import { UpdateTeamMatchStatsDto } from './dto/update-team-match-stats.dto';

@Controller('stats/teams')
@UseGuards(JwtAuthGuard)
export class TeamMatchStatsController {
  constructor(private readonly teamMatchStatsService: TeamMatchStatsService) {}

  @Get()
  async findAll(
    @Query('team_id') teamId?: string,
    @Query('match_id') matchId?: string,
  ) {
    const results = await this.teamMatchStatsService.findAll(
      teamId ? parseInt(teamId) : undefined,
      matchId ? parseInt(matchId) : undefined,
    );
    
    return {
      count: results.length,
      next: null,
      previous: null,
      results,
    };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamMatchStatsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  create(@Body() createTeamMatchStatsDto: CreateTeamMatchStatsDto) {
    return this.teamMatchStatsService.create(createTeamMatchStatsDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamMatchStatsDto: UpdateTeamMatchStatsDto,
  ) {
    return this.teamMatchStatsService.update(id, updateTeamMatchStatsDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.teamMatchStatsService.remove(id);
    return { message: 'Team match stats deleted successfully' };
  }
}
