import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

async function testSMTP() {
  console.log('🔍 Testing SMTP Configuration...\n');
  
  const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  console.log('📧 SMTP Config:');
  console.log(`   Host: ${smtpConfig.host}`);
  console.log(`   Port: ${smtpConfig.port}`);
  console.log(`   Secure: ${smtpConfig.secure}`);
  console.log(`   User: ${smtpConfig.auth.user}`);
  console.log(`   Password: ${smtpConfig.auth.pass ? '***' + smtpConfig.auth.pass.slice(-4) : 'NOT SET'}\n`);

  const transporter = nodemailer.createTransport(smtpConfig);

  try {
    console.log('📮 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    console.log('📧 Attempting to send test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: 'admin@idasports.io',
      subject: 'SMTP Test - Verification Email',
      html: '<h1>This is a test email</h1><p>If you received this, SMTP is working correctly!</p>',
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}\n`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ SMTP Error:', err.message);
    if ((error as any).code) console.error(`   Error Code: ${(error as any).code}`);
    if ((error as any).response) console.error(`   SMTP Response: ${(error as any).response}`);
  }
}

testSMTP();
