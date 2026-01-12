import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async create(userId: string): Promise<Subscription> {
    const subscription = this.subscriptionsRepository.create({
      user_id: userId,
      status: SubscriptionStatus.NONE,
    });
    return this.subscriptionsRepository.save(subscription);
  }

  async activate(
    subscriptionId: string,
    durationDays = 30,
    updatedBy = 'webhook',
  ): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.starts_at = now;
    subscription.expires_at = expiresAt;
    subscription.updated_by = updatedBy;

    return this.subscriptionsRepository.save(subscription);
  }

  async cancel(subscriptionId: string, updatedBy = 'user'): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.auto_renew = false;
    subscription.updated_by = updatedBy;

    return this.subscriptionsRepository.save(subscription);
  }

  async isActive(userId: string): Promise<boolean> {
    const subscription = await this.findByUserId(userId);
    
    if (!subscription) {
      return false;
    }

    return (
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.expires_at &&
      subscription.expires_at > new Date()
    );
  }

  async getStatus(userId: string): Promise<{
    status: SubscriptionStatus;
    expiresAt: Date | null;
    isActive: boolean;
  }> {
    const subscription = await this.findByUserId(userId);

    if (!subscription) {
      return {
        status: SubscriptionStatus.NONE,
        expiresAt: null,
        isActive: false,
      };
    }

    const isActive = await this.isActive(userId);

    return {
      status: subscription.status,
      expiresAt: subscription.expires_at,
      isActive,
    };
  }

  // Cron job to expire subscriptions
  @Cron(CronExpression.EVERY_HOUR)
  async expireSubscriptions(): Promise<void> {
    const now = new Date();

    await this.subscriptionsRepository.update(
      {
        status: SubscriptionStatus.ACTIVE,
        expires_at: LessThan(now),
      },
      {
        status: SubscriptionStatus.EXPIRED,
        updated_by: 'system',
      },
    );
  }
}
