import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidationService } from './validation.service';

@ApiTags('Validation')
@Controller('validate')
export class ValidationController {
  constructor(private validationService: ValidationService) {}

  @Post('access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async validateAccess(@Request() req) {
    return this.validationService.validateAccess(req.user.userId);
  }

  @Post('endpoint')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async validateEndpoint(@Request() req, @Body() body: { endpoint: string }) {
    const canAccess = await this.validationService.canAccessEndpoint(
      req.user.userId,
      body.endpoint,
    );

    return {
      canAccess,
      endpoint: body.endpoint,
    };
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async checkSubscription(@Request() req) {
    const validation = await this.validationService.validateAccess(req.user.userId);
    return {
      subscriptionStatus: validation.subscriptionStatus,
      hasAccess: validation.hasAccess,
    };
  }
}
