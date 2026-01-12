import { Module } from '@nestjs/common';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validation.service';
import { UsersModule } from '../users/users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, SubscriptionsModule, AuthModule],
  controllers: [ValidationController],
  providers: [ValidationService],
})
export class ValidationModule {}
