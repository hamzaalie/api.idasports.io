import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
import { PaymentsModule } from '../payments/payments.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PaymentsModule, AuditModule, ConfigModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
