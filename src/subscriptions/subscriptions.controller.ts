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
          id: 'scout-basic',
          name: 'SCOUT BASIC',
          price: 19,
          currency: '€',
          period: 'mois',
          duration: 30,
          target: 'packages.basic.target',
          features: [
            'packages.basic.feature1',
            'packages.basic.feature2',
            'packages.basic.feature3',
            'packages.basic.feature4',
            'packages.basic.feature5'
          ]
        },
        {
          id: 'scout-pro',
          name: 'SCOUT PRO',
          price: 49,
          currency: '€',
          period: 'mois',
          duration: 30,
          target: 'packages.pro.target',
          features: [
            'packages.pro.feature1',
            'packages.pro.feature2',
            'packages.pro.feature3',
            'packages.pro.feature4',
            'packages.pro.feature5',
            'packages.pro.feature6'
          ]
        },
        {
          id: 'club-partner',
          name: 'CLUB PARTNER',
          price: 149,
          currency: '€',
          period: 'mois',
          duration: 30,
          target: 'packages.partner.target',
          features: [
            'packages.partner.feature1',
            'packages.partner.feature2',
            'packages.partner.feature3',
            'packages.partner.feature4',
            'packages.partner.feature5'
          ]
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
