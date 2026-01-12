import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function verifyEmail(email: string) {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    // Find user by email
    const users = await AppDataSource.query(
      'SELECT id, email, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ User not found with email:', email);
      await AppDataSource.destroy();
      return;
    }

    const user = users[0];
    console.log('📧 User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Verified: ${user.email_verified}`);

    if (user.email_verified) {
      console.log('\n✅ Email is already verified!');
    } else {
      // Verify the email
      await AppDataSource.query(
        'UPDATE users SET email_verified = true, email_verification_token = NULL WHERE id = $1',
        [user.id]
      );
      console.log('\n✅ Email verified successfully!');
      console.log('You can now log in.');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get email from command line or use default
const email = process.argv[2] || 'paladinmarketers@gmail.com';
verifyEmail(email);
