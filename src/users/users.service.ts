import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRoleEntity, UserRole } from './entities/user-role.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { Invoice } from '../payments/entities/invoice.entity';
import { AccountResponseDto, AccountSubscriptionDto, AccountPaymentDto, AccountInvoiceDto } from './dto/account-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserRoleEntity)
    private userRolesRepository: Repository<UserRoleEntity>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
  ) {}

  async findById(id: string): Promise<User> {
    console.log('[UsersService] Finding user by ID:', id, 'Type:', typeof id);
    const user = await this.usersRepository.findOne({ 
      where: { id },
      relations: ['roles'],
    });
    console.log('[UsersService] Query result:', user ? 'Found' : 'Not found');
    if (!user) {
      // Debug: check if there are any users at all
      const count = await this.usersRepository.count();
      console.log('[UsersService] Total users in database:', count);
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['roles'],
      order: { created_at: 'DESC' },
    });
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.findById(userId);
    await this.usersRepository.remove(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email_verification_token: token },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { password_reset_token: token },
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, userData);
    return this.findById(id);
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const roles = await this.userRolesRepository.find({
      where: { user_id: userId },
    });
    return roles.map((r) => r.role);
  }

  async assignRole(
    userId: string,
    role: UserRole,
    assignedBy?: string,
  ): Promise<UserRoleEntity> {
    const existing = await this.userRolesRepository.findOne({
      where: { user_id: userId, role },
    });

    if (existing) {
      return existing;
    }

    const userRole = this.userRolesRepository.create({
      user_id: userId,
      role,
      assigned_by: assignedBy,
    });

    return this.userRolesRepository.save(userRole);
  }

  async removeRole(userId: string, role: UserRole): Promise<void> {
    await this.userRolesRepository.delete({ user_id: userId, role });
  }

  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    const count = await this.userRolesRepository.count({
      where: { user_id: userId, role },
    });
    return count > 0;
  }

  async getAccountDetails(userId: string): Promise<AccountResponseDto> {
    // Fetch user with roles
    const user = await this.findById(userId);
    const userRoles = await this.getUserRoles(userId);

    // Fetch subscription
    const subscription = await this.subscriptionsRepository.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    // Fetch all payments
    const payments = await this.paymentsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    // Fetch all invoices with payment info
    const invoices = await this.invoicesRepository.find({
      where: { user_id: userId },
      relations: ['payment'],
      order: { issued_at: 'DESC' },
    });

    // Calculate subscription details
    const subscriptionDto: AccountSubscriptionDto = this.mapSubscriptionDto(subscription);

    // Map payments
    const paymentsDto: AccountPaymentDto[] = payments.map((payment) => ({
      id: payment.id,
      transactionId: payment.transaction_id,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.payment_method,
      createdAt: payment.created_at,
      completedAt: payment.completed_at,
    }));

    // Map invoices
    const invoicesDto: AccountInvoiceDto[] = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      amount: Number(invoice.amount),
      issuedAt: invoice.issued_at,
      paidAt: invoice.paid_at,
      pdfUrl: invoice.pdf_url,
      paymentStatus: invoice.payment?.status || PaymentStatus.PENDING,
    }));

    // Calculate stats
    const completedPayments = payments.filter((p) => p.status === PaymentStatus.COMPLETED);
    const totalSpent = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const lastPayment = completedPayments.length > 0 ? completedPayments[0] : null;

    return {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
        roles: userRoles,
        createdAt: user.created_at,
      },
      subscription: subscriptionDto,
      payments: paymentsDto,
      invoices: invoicesDto,
      stats: {
        totalPayments: completedPayments.length,
        totalSpent,
        activeSince: subscription?.starts_at || null,
        lastPaymentDate: lastPayment?.completed_at || null,
      },
    };
  }

  private mapSubscriptionDto(subscription: Subscription | null): AccountSubscriptionDto {
    if (!subscription) {
      return {
        status: SubscriptionStatus.NONE,
        isActive: false,
        startsAt: null,
        expiresAt: null,
        renewalDate: null,
        autoRenew: false,
        daysRemaining: null,
      };
    }

    const now = new Date();
    const isActive =
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.expires_at &&
      subscription.expires_at > now;

    let daysRemaining: number | null = null;
    if (subscription.expires_at && isActive) {
      const diffTime = subscription.expires_at.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      status: subscription.status,
      isActive,
      startsAt: subscription.starts_at,
      expiresAt: subscription.expires_at,
      renewalDate: subscription.auto_renew ? subscription.expires_at : null,
      autoRenew: subscription.auto_renew,
      daysRemaining,
    };
  }
}
