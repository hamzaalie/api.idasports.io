import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendVerificationEmail(
    email: string,
    token: string,
    platform?: 'v1' | 'm3',
  ): Promise<boolean> {
    // Determine the correct frontend URL based on platform
    let baseUrl: string;
    if (platform === 'v1') {
      const v1Url = this.configService.get('V1_URL') || 'http://localhost:3001';
      // Handle multiple URLs separated by comma - use the first one
      baseUrl = v1Url.split(',')[0].trim();
    } else {
      // Default to M3
      baseUrl = this.configService.get('M3_URL') || 'http://localhost:5173';
    }
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email - Scouting Platform',
        template: './verification',
        context: {
          email,
          verificationUrl,
        },
      });

      this.logger.log(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error.stack);
      
      // Show verification link in console as fallback
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL SENDING FAILED - VERIFICATION LINK:');
      console.log('='.repeat(80));
      console.log(`   Email: ${email}`);
      console.log(`   Token: ${token}`);
      console.log(`   Verification URL: ${verificationUrl}`);
      console.log('='.repeat(80) + '\n');
      
      return false;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
  ): Promise<boolean> {
    const v1Url = this.configService.get('V1_URL') || 'http://localhost:3001';
    // Handle multiple URLs separated by comma - use the first one
    const baseUrl = v1Url.split(',')[0].trim();
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your Password - Scouting Platform',
        template: './password-reset',
        context: {
          email,
          resetUrl,
        },
      });

      this.logger.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error.stack);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to Scouting Platform',
        template: './welcome',
        context: {
          email,
          name: name || email.split('@')[0],
          loginUrl: this.configService.get('V1_URL'),
        },
      });

      this.logger.log(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error.stack);
      return false;
    }
  }

  async sendSubscriptionActivatedEmail(
    email: string,
    expiresAt: Date,
  ): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Subscription Activated - Scouting Platform',
        template: './subscription-activated',
        context: {
          email,
          expiresAt: expiresAt.toLocaleDateString(),
          m3Url: this.configService.get('M3_URL'),
        },
      });

      this.logger.log(`Subscription activated email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send subscription email to ${email}`, error.stack);
      return false;
    }
  }

  async sendSubscriptionExpiringEmail(
    email: string,
    expiresAt: Date,
  ): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Subscription Expiring Soon - Scouting Platform',
        template: './subscription-expiring',
        context: {
          email,
          expiresAt: expiresAt.toLocaleDateString(),
          renewUrl: `${this.configService.get('V1_URL')}/subscribe`,
        },
      });

      this.logger.log(`Subscription expiring email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send expiring email to ${email}`, error.stack);
      return false;
    }
  }
}
