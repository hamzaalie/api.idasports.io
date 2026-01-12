import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Invoice } from './entities/invoice.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user-role.entity';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    private subscriptionsService: SubscriptionsService,
    private emailService: EmailService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async initiatePayment(
    userId: string,
    plan: string,
    amount: number,
  ): Promise<any> {
    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Create pending payment record
    const payment = await this.createPayment(userId, transactionId, amount);

    // Get user info
    const user = await this.usersService.findById(userId);

    // Return payment initiation data for frontend
    // Frontend will use this to redirect to CinetPay
    return {
      transactionId,
      amount: Math.round(amount * 655), // Convert USD to XOF (CFA Franc)
      currency: 'XOF',
      plan,
      user: {
        email: user.email,
        id: userId,
      },
      // CinetPay configuration (frontend will handle redirect)
      cinetpayConfig: {
        apikey: this.configService.get('CINETPAY_API_KEY'),
        site_id: this.configService.get('CINETPAY_SITE_ID'),
        notify_url: `${this.configService.get('BACKEND_URL')}/api/webhooks/cinetpay`,
        return_url: `${this.configService.get('V1_URL')}/payment/success`,
        cancel_url: `${this.configService.get('V1_URL')}/payment/cancel`,
      },
    };
  }

  async createPayment(
    userId: string,
    transactionId: string,
    amount: number,
  ): Promise<Payment> {
    const payment = this.paymentsRepository.create({
      user_id: userId,
      transaction_id: transactionId,
      amount,
      status: PaymentStatus.PENDING,
    });

    return this.paymentsRepository.save(payment);
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return this.paymentsRepository.findOne({
      where: { transaction_id: transactionId },
    });
  }

  async completePayment(
    transactionId: string,
    cinetpayResponse: any,
  ): Promise<Payment> {
    const payment = await this.findByTransactionId(transactionId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Prevent duplicate processing (idempotency)
    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.completed_at = new Date();
    payment.cinetpay_response = cinetpayResponse;

    const updatedPayment = await this.paymentsRepository.save(payment);

    // Create or activate subscription
    let subscription = await this.subscriptionsService.findByUserId(
      payment.user_id,
    );

    if (!subscription) {
      subscription = await this.subscriptionsService.create(payment.user_id);
    }

    await this.subscriptionsService.activate(subscription.id, 30, 'webhook');

    // Assign subscriber role to user
    await this.usersService.assignRole(payment.user_id, UserRole.SUBSCRIBER);

    // Update payment with subscription reference
    payment.subscription_id = subscription.id;
    await this.paymentsRepository.save(payment);

    // Generate invoice
    await this.generateInvoice(updatedPayment);

    // Send subscription activated email
    const user = await this.usersService.findById(payment.user_id);
    if (user && subscription.expires_at) {
      try {
        await this.emailService.sendSubscriptionActivatedEmail(
          user.email,
          subscription.expires_at,
        );
      } catch (error) {
        console.log(`\n🎉 Subscription Activated Email (not sent - SMTP not configured):`);
        console.log(`   To: ${user.email}`);
        console.log(`   Expires: ${subscription.expires_at}\n`);
      }
    }

    return updatedPayment;
  }

  async failPayment(transactionId: string): Promise<Payment> {
    const payment = await this.findByTransactionId(transactionId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.status = PaymentStatus.FAILED;
    return this.paymentsRepository.save(payment);
  }

  async cancelPayment(transactionId: string): Promise<Payment> {
    const payment = await this.findByTransactionId(transactionId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Prevent duplicate processing (idempotency)
    if (payment.status === PaymentStatus.CANCELLED) {
      return payment;
    }

    payment.status = PaymentStatus.CANCELLED;
    return this.paymentsRepository.save(payment);
  }

  async processPayDunyaPayment(
    transactionId: string,
    paydunyaResponse: any,
    status: PaymentStatus,
  ): Promise<Payment> {
    const payment = await this.findByTransactionId(transactionId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Prevent duplicate processing (idempotency)
    if (
      payment.status === PaymentStatus.COMPLETED ||
      payment.status === PaymentStatus.FAILED ||
      payment.status === PaymentStatus.CANCELLED
    ) {
      return payment;
    }

    payment.status = status;
    payment.cinetpay_response = paydunyaResponse; // Reusing field for PayDunya data
    
    if (status === PaymentStatus.COMPLETED) {
      payment.completed_at = new Date();

      // Create or activate subscription
      let subscription = await this.subscriptionsService.findByUserId(
        payment.user_id,
      );

      if (!subscription) {
        subscription = await this.subscriptionsService.create(payment.user_id);
      }

      await this.subscriptionsService.activate(subscription.id, 30, 'paydunya-webhook');

      // Assign subscriber role to user
      await this.usersService.assignRole(payment.user_id, UserRole.SUBSCRIBER);

      // Update payment with subscription reference
      payment.subscription_id = subscription.id;

      // Generate invoice
      await this.generateInvoice(await this.paymentsRepository.save(payment));

      // Send subscription activated email
      const user = await this.usersService.findById(payment.user_id);
      if (user && subscription.expires_at) {
        try {
          await this.emailService.sendSubscriptionActivatedEmail(
            user.email,
            subscription.expires_at,
          );
        } catch (error) {
          console.log(`\n🎉 Subscription Activated Email (not sent - SMTP not configured):`);
          console.log(`   To: ${user.email}`);
          console.log(`   Expires: ${subscription.expires_at}\n`);
        }
      }
    }

    return this.paymentsRepository.save(payment);
  }

  private async generateInvoice(payment: Payment): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = this.invoicesRepository.create({
      user_id: payment.user_id,
      payment_id: payment.id,
      invoice_number: invoiceNumber,
      amount: payment.amount,
      issued_at: new Date(),
      paid_at: payment.completed_at,
    });

    return this.invoicesRepository.save(invoice);
  }

  private async generateInvoiceNumber(): Promise<string> {
    const count = await this.invoicesRepository.count();
    const year = new Date().getFullYear();
    const invoiceNum = (count + 1).toString().padStart(6, '0');
    return `INV-${year}-${invoiceNum}`;
  }
}
