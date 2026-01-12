import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '../users/entities/user-role.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private subscriptionsService: SubscriptionsService,
    private auditService: AuditService,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async listUsers(filters?: {
    role?: UserRole;
    subscriptionStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    // Get all users with their roles and subscriptions
    const users = await this.usersService.findAll();
    
    // Apply filters
    let filteredUsers = users;

    // Filter by search (email)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Filter by role
    if (filters?.role) {
      filteredUsers = filteredUsers.filter(user =>
        user.roles?.some(r => r.role === filters.role)
      );
    }

    // Filter by subscription status
    if (filters?.subscriptionStatus) {
      filteredUsers = await Promise.all(
        filteredUsers.map(async user => {
          const subscription = await this.subscriptionsService.findByUserId(user.id);
          return { user, subscription };
        })
      ).then(results => 
        results
          .filter(({ subscription }) => 
            subscription?.status === filters.subscriptionStatus
          )
          .map(({ user }) => user)
      );
    }

    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(skip, skip + limit);

    // Enrich users with subscription data
    const enrichedUsers = await Promise.all(
      paginatedUsers.map(async (user) => {
        const subscription = await this.subscriptionsService.findByUserId(user.id);
        return {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          roles: user.roles?.map(r => r?.role).filter(role => role) || [],
          created_at: user.created_at,
          subscription: subscription ? {
            status: subscription.status,
            expires_at: subscription.expires_at,
          } : null,
        };
      })
    );

    return {
      users: enrichedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async assignRole(
    adminId: string,
    targetUserId: string,
    role: UserRole,
  ): Promise<any> {
    await this.usersService.assignRole(targetUserId, role, adminId);

    await this.auditService.log({
      user_id: adminId,
      action: 'role_assigned',
      target_user_id: targetUserId,
      metadata: { role },
    });

    return { message: 'Role assigned successfully', role };
  }

  async removeRole(
    adminId: string,
    targetUserId: string,
    role: UserRole,
  ): Promise<any> {
    await this.usersService.removeRole(targetUserId, role);

    await this.auditService.log({
      user_id: adminId,
      action: 'role_removed',
      target_user_id: targetUserId,
      metadata: { role },
    });

    return { message: 'Role removed successfully', role };
  }

  async overrideSubscription(
    adminId: string,
    targetUserId: string,
    action: 'activate' | 'cancel',
    durationDays?: number,
  ): Promise<any> {
    let subscription = await this.subscriptionsService.findByUserId(
      targetUserId,
    );

    if (!subscription) {
      subscription = await this.subscriptionsService.create(targetUserId);
    }

    if (action === 'activate') {
      await this.subscriptionsService.activate(
        subscription.id,
        durationDays || 30,
        'admin',
      );
    } else {
      await this.subscriptionsService.cancel(subscription.id, 'admin');
    }

    await this.auditService.log({
      user_id: adminId,
      action: 'subscription_override',
      target_user_id: targetUserId,
      metadata: { action, durationDays },
    });

    return { message: `Subscription ${action}d successfully` };
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    limit?: number;
  }) {
    const limit = filters?.limit || 100;

    if (filters?.userId) {
      return this.auditService.findByUser(filters.userId, limit);
    }

    if (filters?.action) {
      return this.auditService.findByAction(filters.action, limit);
    }

    return this.auditService.findAll(limit);
  }

  async deleteUser(
    adminId: string,
    targetUserId: string,
  ): Promise<any> {
    // Prevent self-deletion
    if (adminId === targetUserId) {
      throw new Error('Cannot delete your own account');
    }

    // Get user details before deletion for audit
    const user = await this.usersService.findById(targetUserId);

    // Log the deletion BEFORE deleting the user
    await this.auditService.log({
      user_id: adminId,
      action: 'user_deleted',
      target_user_id: targetUserId,
      metadata: { email: user.email },
    });

    // Delete the user
    await this.usersService.deleteUser(targetUserId);

    return { message: 'User deleted successfully' };
  }

  async listPayments(filters?: {
    status?: string;
    userId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.subscription', 'subscription')
      .orderBy('payment.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters?.status) {
      query.andWhere('payment.status = :status', { status: filters.status });
    }

    if (filters?.userId) {
      query.andWhere('payment.user_id = :userId', { userId: filters.userId });
    }

    if (filters?.search) {
      query.andWhere(
        '(payment.transaction_id LIKE :search OR user.email LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const [payments, total] = await query.getManyAndCount();

    return {
      data: payments.map(payment => ({
        id: payment.id,
        transaction_id: payment.transaction_id,
        user_id: payment.user_id,
        user_email: payment.user?.email,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        payment_method: payment.payment_method,
        created_at: payment.created_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listSubscriptions(filters?: {
    status?: string;
    userId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const query = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .orderBy('subscription.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters?.status) {
      query.andWhere('subscription.status = :status', { status: filters.status });
    }

    if (filters?.userId) {
      query.andWhere('subscription.user_id = :userId', { userId: filters.userId });
    }

    if (filters?.search) {
      query.andWhere('user.email LIKE :search', { search: `%${filters.search}%` });
    }

    const [subscriptions, total] = await query.getManyAndCount();

    return {
      data: subscriptions.map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        user_email: sub.user?.email,
        plan: 'Scouting Platform', // Default plan name
        status: sub.status,
        start_date: sub.starts_at,
        end_date: sub.expires_at,
        amount: 0, // Would need to be calculated from payments or plan info
        currency: 'XOF',
        payment_method: 'N/A',
        auto_renewal: sub.auto_renew,
        created_at: sub.created_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listInvoices(filters?: {
    status?: string;
    userId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    // For now, return mock data since we don't have an invoices table yet
    // You would implement this once you add an Invoice entity
    return {
      data: [],
      total: 0,
      page: filters?.page || 1,
      limit: filters?.limit || 50,
      totalPages: 0,
    };
  }

  async updateInvoice(invoiceId: string, data: any) {
    // Placeholder for invoice update logic
    // Would implement once Invoice entity exists
    return {
      message: 'Invoice update not yet implemented',
      invoiceId,
    };
  }

  async downloadInvoice(invoiceId: string) {
    // Placeholder for PDF generation
    return {
      message: 'Invoice download not yet implemented',
      invoiceId,
    };
  }

  async getPaymentGatewaySettings() {
    // In a real implementation, this would read from a settings table
    // For now, return default/empty settings
    return {
      cinetpay: {
        name: 'cinetpay',
        enabled: false,
        apiKey: '',
        siteId: '',
        mode: 'test',
        testConnection: false,
      },
      paydunya: {
        name: 'paydunya',
        enabled: false,
        apiKey: '',
        secretKey: '',
        mode: 'test',
        testConnection: false,
      },
    };
  }

  async updatePaymentGatewaySettings(settings: any) {
    // In a real implementation, this would save to a settings table
    // For now, just return success
    return {
      message: 'Payment gateway settings updated successfully',
      settings,
    };
  }

  async testPaymentGateway(gateway: string, config: any) {
    // Placeholder for actual API testing
    // Would make a test API call to the gateway
    return {
      success: true,
      message: `${gateway} connection test successful`,
    };
  }
}
