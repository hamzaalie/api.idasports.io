import { Controller, Get } from '@nestjs/common';

@Controller('pack')
export class PacksController {
  @Get()
  async getAllPacks() {
    // Return subscription plans in the old pack format
    // These match the 3 plans we defined in subscriptions.controller.ts
    return [
      {
        _id: 'basic',
        name: 'SCOUT BASIC',
        price: 19,
        period: 'mois',
        option: 'local',
        features: [
          'Access to player database',
          'Basic search filters',
          'View player profiles',
          'Export up to 10 players/month',
          'Email support'
        ],
        description: 'Perfect for amateur scouts and fans'
      },
      {
        _id: 'pro',
        name: 'SCOUT PRO',
        price: 49,
        period: 'mois',
        option: 'local',
        features: [
          'Everything in Basic',
          'Advanced search filters',
          'Detailed player statistics',
          'Export up to 100 players/month',
          'Video highlights access',
          'Priority email support',
          'Custom reports'
        ],
        description: 'For professional scouts and analysts'
      },
      {
        _id: 'partner',
        name: 'CLUB PARTNER',
        price: 149,
        period: 'mois',
        option: 'local',
        features: [
          'Everything in Pro',
          'Unlimited player exports',
          'API access',
          'Multi-user accounts',
          'Dedicated account manager',
          '24/7 phone support',
          'Custom integrations',
          'White-label options'
        ],
        description: 'For clubs and agencies'
      }
    ];
  }
}
