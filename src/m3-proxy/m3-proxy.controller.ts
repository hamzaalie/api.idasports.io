import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.entity';
import { M3ProxyService } from './m3-proxy.service';
import FormData = require('form-data');

@ApiTags('M3 Proxy')
@ApiBearerAuth()
@Controller('m3')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
export class M3ProxyController {
  constructor(private readonly m3ProxyService: M3ProxyService) {}

  // Teams endpoints
  @Get('teams')
  @ApiOperation({ summary: 'Get all teams' })
  async getTeams(@Query() query: any) {
    return this.m3ProxyService.forwardRequest(
      'GET',
      `/api/teams/?${new URLSearchParams(query).toString()}`,
    );
  }

  @Get('teams/:id')
  @ApiOperation({ summary: 'Get team by ID' })
  async getTeam(@Param('id') id: string) {
    return this.m3ProxyService.forwardRequest('GET', `/api/teams/${id}/`);
  }

  @Post('teams')
  @ApiOperation({ summary: 'Create team' })
  @UseInterceptors(FileInterceptor('logo'))
  async createTeam(@Body() data: any, @UploadedFile() file?: Express.Multer.File) {
    // If file is uploaded, we need to handle it differently
    if (file) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('location', data.location);
      if (data.founded_year) formData.append('founded_year', data.founded_year);
      formData.append('logo', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      
      return this.m3ProxyService.forwardRequest('POST', '/api/teams/', formData, {
        ...formData.getHeaders(),
      });
    }
    
    return this.m3ProxyService.forwardRequest('POST', '/api/teams/', data);
  }

  @Put('teams/:id')
  @ApiOperation({ summary: 'Update team' })
  async updateTeam(@Param('id') id: string, @Body() data: any) {
    return this.m3ProxyService.forwardRequest('PUT', `/api/teams/${id}/`, data);
  }

  @Delete('teams/:id')
  @ApiOperation({ summary: 'Delete team' })
  async deleteTeam(@Param('id') id: string) {
    return this.m3ProxyService.forwardRequest('DELETE', `/api/teams/${id}/`);
  }

  // Players endpoints
  @Get('players')
  @ApiOperation({ summary: 'Get all players' })
  async getPlayers(@Query() query: any) {
    return this.m3ProxyService.forwardRequest(
      'GET',
      `/api/players/?${new URLSearchParams(query).toString()}`,
    );
  }

  @Get('players/:id')
  @ApiOperation({ summary: 'Get player by ID' })
  async getPlayer(@Param('id') id: string) {
    return this.m3ProxyService.forwardRequest('GET', `/api/players/${id}/`);
  }

  @Post('players')
  @ApiOperation({ summary: 'Create player' })
  async createPlayer(@Body() data: any) {
    return this.m3ProxyService.forwardRequest('POST', '/api/players/', data);
  }

  @Put('players/:id')
  @ApiOperation({ summary: 'Update player' })
  async updatePlayer(@Param('id') id: string, @Body() data: any) {
    return this.m3ProxyService.forwardRequest('PUT', `/api/players/${id}/`, data);
  }

  @Delete('players/:id')
  @ApiOperation({ summary: 'Delete player' })
  async deletePlayer(@Param('id') id: string) {
    return this.m3ProxyService.forwardRequest('DELETE', `/api/players/${id}/`);
  }

  // Matches endpoints
  @Get('matches')
  @ApiOperation({ summary: 'Get all matches' })
  async getMatches(@Query() query: any) {
    return this.m3ProxyService.forwardRequest(
      'GET',
      `/api/matches/?${new URLSearchParams(query).toString()}`,
    );
  }

  @Get('matches/:id')
  @ApiOperation({ summary: 'Get match by ID' })
  async getMatch(@Param('id') id: string) {
    return this.m3ProxyService.forwardRequest('GET', `/api/matches/${id}/`);
  }

  @Post('matches')
  @ApiOperation({ summary: 'Create match' })
  async createMatch(@Body() data: any) {
    return this.m3ProxyService.forwardRequest('POST', '/api/matches/', data);
  }

  @Put('matches/:id')
  @ApiOperation({ summary: 'Update match' })
  async updateMatch(@Param('id') id: string, @Body() data: any) {
    return this.m3ProxyService.forwardRequest('PUT', `/api/matches/${id}/`, data);
  }

  @Delete('matches/:id')
  @ApiOperation({ summary: 'Delete match' })
  async deleteMatch(@Param('id') id: string) {
    return this.m3ProxyService.forwardRequest('DELETE', `/api/matches/${id}/`);
  }

  // Stats endpoints
  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard stats' })
  async getStats() {
    return this.m3ProxyService.forwardRequest('GET', '/api/stats/dashboard/');
  }
}
