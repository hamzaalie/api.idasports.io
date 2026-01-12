/**
 * Email Test Script
 * 
 * Quick test to verify SMTP configuration is working
 * 
 * Usage:
 * 1. Configure SMTP in .env
 * 2. Update TEST_EMAIL below
 * 3. Run: npm run test:email
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EmailService } from './email/email.service';

async function testEmail() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const emailService = app.get(EmailService);

  const TEST_EMAIL = 'your-email@example.com'; // CHANGE THIS

  console.log('\n=== Email Service Test ===\n');
  console.log(`Sending test email to: ${TEST_EMAIL}\n`);

  try {
    // Test verification email
    console.log('1. Testing verification email...');
    await emailService.sendVerificationEmail(TEST_EMAIL, 'test-token-123');
    console.log('✅ Verification email sent!\n');

    // Test password reset email
    console.log('2. Testing password reset email...');
    await emailService.sendPasswordResetEmail(TEST_EMAIL, 'reset-token-456');
    console.log('✅ Password reset email sent!\n');

    console.log('✅ All tests passed! Check your inbox.\n');
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Check SMTP credentials in .env');
    console.error('- For Gmail: Use App Password, not regular password');
    console.error('- Verify 2-Step Verification is enabled\n');
  }

  await app.close();
  process.exit(0);
}

testEmail();
