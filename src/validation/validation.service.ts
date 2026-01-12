import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { UserRole } from '../users/entities/user-role.entity';

@Injectable()
export class ValidationService {
  constructor(
    private usersService: UsersService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async validateAccess(userId: string): Promise<{
    hasAccess: boolean;
    roles: UserRole[];
    subscriptionStatus: SubscriptionStatus;
    reason?: string;
  }> {
    const user = await this.usersService.findById(userId);
    const roles = await this.usersService.getUserRoles(userId);
    const subscriptionData = await this.subscriptionsService.getStatus(userId);

    // Admin users always have access
    const isAdmin =
      roles.includes(UserRole.SUPER_ADMIN) ||
      roles.includes(UserRole.SUPPORT_ADMIN) ||
      roles.includes(UserRole.READ_ONLY_ADMIN);

    if (isAdmin) {
      return {
        hasAccess: true,
        roles,
        subscriptionStatus: subscriptionData.status,
      };
    }

    // Limited users have restricted access
    if (roles.includes(UserRole.LIMITED_USER)) {
      return {
        hasAccess: true,
        roles,
        subscriptionStatus: subscriptionData.status,
      };
    }

    // Subscribers must have active subscription
    if (roles.includes(UserRole.SUBSCRIBER)) {
      if (subscriptionData.isActive) {
        return {
          hasAccess: true,
          roles,
          subscriptionStatus: subscriptionData.status,
        };
      } else {
        return {
          hasAccess: false,
          roles,
          subscriptionStatus: subscriptionData.status,
          reason: 'Subscription expired or inactive',
        };
      }
    }

    // Players always have free access to manage their own profiles
    // Scouts need subscriptions to view/search player data
    // This allows players to register and create profiles without payment
    return {
      hasAccess: true,
      roles: [], // No specific role, but allowed basic access
      subscriptionStatus: subscriptionData.status,
      reason: 'Free player access (scouts require subscription for full features)',
    };
  }

  async canAccessEndpoint(userId: string, endpoint: string): Promise<boolean> {
    const validation = await this.validateAccess(userId);

    if (!validation.hasAccess) {
      return false;
    }

    // Players (no subscription) can access their own profile and basic features
    const playerEndpoints = [
      '/api/players/me',
      '/api/players/profile',
      '/api/matches/my-matches',
      '/api/users/auth/me',
      '/api/stats/my-stats',
    ];

    const isPlayerEndpoint = playerEndpoints.some((allowed) => endpoint.startsWith(allowed));

    // If accessing player endpoints, no subscription required
    if (isPlayerEndpoint) {
      return true;
    }

    // Scout features (search, view all players, etc.) require active subscription
    const scoutEndpoints = [
      '/api/players/search',
      '/api/players/list',
      '/api/dashboard',
      '/api/analytics',
    ];

    const isScoutEndpoint = scoutEndpoints.some((scout) => endpoint.startsWith(scout));

    if (isScoutEndpoint) {
      // Only subscribers can access scout features
      return validation.roles.includes(UserRole.SUBSCRIBER) && validation.subscriptionStatus === SubscriptionStatus.ACTIVE;
    }

    // Limited users can only access data-entry endpoints
    if (validation.roles.includes(UserRole.LIMITED_USER)) {
      const allowedEndpoints = [
        '/api/data-entry/player-stats',
        '/api/data-entry/match-report',
        '/api/data-entry/forms',
      ];

      return allowedEndpoints.some((allowed) => endpoint.startsWith(allowed));
    }

    return true;
  }
}
