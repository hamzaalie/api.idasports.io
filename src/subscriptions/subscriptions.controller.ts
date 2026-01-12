import { Controller, Get, Post, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  async getPlans() {
    return {
      plans: [
        {
          id: 'monthly',
          name: 'Monthly Plan',
          price: 9.99,
          currency: 'USD',
          duration: 30,
          features: ['Access to M3 platform', 'Basic scouting tools', 'Email support']
        },
        {
          id: 'quarterly',
          name: 'Quarterly Plan',
          price: 24.99,
          currency: 'USD',
          duration: 90,
          features: ['Access to M3 platform', 'Advanced scouting tools', 'Priority support', '15% discount']
        },
        {
          id: 'annual',
          name: 'Annual Plan',
          price: 89.99,
          currency: 'USD',
          duration: 365,
          features: ['Access to M3 platform', 'Premium scouting tools', 'Dedicated support', '25% discount', 'Early access to new features']
        }
      ]
    };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user subscription status' })
  async getStatus(@Request() req) {
    return this.subscriptionsService.getStatus(req.user.userId);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel user subscription' })
  async cancel(@Request() req) {
    const subscription = await this.subscriptionsService.findByUserId(
      req.user.userId,
    );
    if (!subscription) {
      throw new Error('No subscription found');
    }
    return this.subscriptionsService.cancel(subscription.id, 'user');
  }
}
