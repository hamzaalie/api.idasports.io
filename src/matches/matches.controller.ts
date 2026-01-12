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
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.entity';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('team_id') teamId?: string,
    @Query('competition') competition?: string,
  ) {
    const results = await this.matchesService.findAll(
      status, 
      teamId ? parseInt(teamId) : undefined,
      competition,
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
    return this.matchesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  create(@Body() createMatchDto: CreateMatchDto, @Request() req) {
    // Optionally add created_by_id from authenticated user
    if (!createMatchDto.created_by_id && req.user?.userId) {
      createMatchDto.created_by_id = req.user.userId;
    }
    return this.matchesService.create(createMatchDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.matchesService.remove(id);
    return { message: 'Match deleted successfully' };
  }
}
