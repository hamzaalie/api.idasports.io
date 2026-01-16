import { Controller, Get } from '@nestjs/common';

@Controller('pack')
export class PacksController {
  @Get()
  async getAllPacks() {
    // Return subscription plans in the format expected by v1 frontend
    return [
      {
        id: 'scout-basic',
        title: 'SCOUT BASIC',
        price: 19,
        currency: '€',
        period: 'mois',
        option: 'local',
        roleId: 2,
        target: 'packages.basic.target',
        description: 'Perfect for users who need to check facts or see basic info',
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
        title: 'SCOUT PRO',
        price: 49,
        currency: '€',
        period: 'mois',
        option: 'local',
        roleId: 2,
        target: 'packages.pro.target',
        description: 'The Full Software Experience with videos and advanced stats',
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
        title: 'CLUB PARTNER',
        price: 149,
        currency: '€',
        period: 'mois',
        option: 'local',
        roleId: 2,
        target: 'packages.partner.target',
        description: 'Service-Led solution with dedicated support and priority access',
        features: [
          'packages.partner.feature1',
          'packages.partner.feature2',
          'packages.partner.feature3',
          'packages.partner.feature4',
          'packages.partner.feature5'
        ]
      }
    ];
  }
}
