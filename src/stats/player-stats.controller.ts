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
import { PlayerStatsService } from './player-stats.service';
import { CreatePlayerStatsDto } from './dto/create-player-stats.dto';
import { UpdatePlayerStatsDto } from './dto/update-player-stats.dto';

@Controller('stats/players')
@UseGuards(JwtAuthGuard)
export class PlayerStatsController {
  constructor(private readonly playerStatsService: PlayerStatsService) {}

  @Get()
  async findAll(
    @Query('player_id') playerId?: string,
    @Query('match_id') matchId?: string,
  ) {
    const results = await this.playerStatsService.findAll(
      playerId ? parseInt(playerId) : undefined,
      matchId ? parseInt(matchId) : undefined,
    );
    
    return {
      count: results.length,
      next: null,
      previous: null,
      results,
    };
  }

  @Get('aggregate/:playerId')
  getPlayerAggregateStats(@Param('playerId', ParseIntPipe) playerId: number) {
    return this.playerStatsService.getPlayerAggregateStats(playerId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.playerStatsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  create(@Body() createPlayerStatsDto: CreatePlayerStatsDto) {
    return this.playerStatsService.create(createPlayerStatsDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlayerStatsDto: UpdatePlayerStatsDto,
  ) {
    return this.playerStatsService.update(id, updatePlayerStatsDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.playerStatsService.remove(id);
    return { message: 'Player stats deleted successfully' };
  }
}
