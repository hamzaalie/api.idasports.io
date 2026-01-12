import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user-role.entity';
import { UsersService } from './users.service';
import { AccountResponseDto } from './dto/account-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  async getAllUsers(
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    const users = await this.usersService.findAll();
    // Return Django REST Framework compatible pagination format
    return {
      count: users.length,
      next: null,
      previous: null,
      results: users,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req) {
    console.log('[UsersController] Getting profile for user:', req.user);
    console.log('[UsersController] UserId:', req.user.userId, 'Type:', typeof req.user.userId);
    const user = await this.usersService.findById(req.user.userId);
    console.log('[UsersController] Found user:', user ? user.email : 'NOT FOUND');
    return user;
  }

  @Get('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get complete account details with subscription, payments, and invoices' })
  @ApiResponse({
    status: 200,
    description: 'Account details retrieved successfully',
    type: AccountResponseDto,
  })
  async getAccountDetails(@Request() req): Promise<AccountResponseDto> {
    return this.usersService.getAccountDetails(req.user.userId);
  }
}
