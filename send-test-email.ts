import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

async function sendTestEmail() {
  console.log('\n📧 Testing Email with Hostinger SMTP...\n');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });

  try {
    console.log('🔍 Verifying Hostinger SMTP connection...');
    await transporter.verify();
    console.log('✅ Hostinger SMTP connection verified!\n');

    console.log('📮 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'hamzaalisocials@gmail.com',
      subject: 'Test Email from IDA Scouting Platform',
      html: `
        <h1>Test Email Successfully Sent!</h1>
        <p>This is a test email from the IDA Scouting Platform.</p>
        <p>If you received this, the email configuration is working correctly!</p>
        <hr>
        <p><strong>Sent from:</strong> idasports2025@gmail.com</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: hamzaalisocials@gmail.com\n`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Error sending email:');
    console.error(`   Message: ${err.message}`);
    if ((error as any).code) console.error(`   Code: ${(error as any).code}`);
    console.error('\n');
  }

  process.exit(0);
}

sendTestEmail();
