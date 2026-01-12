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
import { PlayersService } from './players.service';

@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('team_id') teamId?: string,
    @Query('position') position?: string,
    @Query('page') page?: string,
  ) {
    const results = await this.playersService.findAll(search, teamId ? parseInt(teamId) : undefined, position);
    // Return Django REST Framework compatible pagination format
    return {
      count: results.length,
      next: null,
      previous: null,
      results,
    };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  create(@Body() data: Partial<any>) {
    return this.playersService.create(data);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<any>) {
    return this.playersService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.remove(id);
  }
}
