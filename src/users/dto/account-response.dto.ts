import { SubscriptionStatus } from '../../subscriptions/entities/subscription.entity';
import { PaymentStatus } from '../../payments/entities/payment.entity';

export class AccountSubscriptionDto {
  status: SubscriptionStatus;
  isActive: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  renewalDate: Date | null;
  autoRenew: boolean;
  daysRemaining: number | null;
}

export class AccountPaymentDto {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export class AccountInvoiceDto {
  id: string;
  invoiceNumber: string;
  amount: number;
  issuedAt: Date;
  paidAt: Date | null;
  pdfUrl: string | null;
  paymentStatus: PaymentStatus;
}

export class AccountResponseDto {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    roles: string[];
    createdAt: Date;
  };
  subscription: AccountSubscriptionDto;
  payments: AccountPaymentDto[];
  invoices: AccountInvoiceDto[];
  stats: {
    totalPayments: number;
    totalSpent: number;
    activeSince: Date | null;
    lastPaymentDate: Date | null;
  };
}
