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

async function checkUser() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    // Check all users
    const users = await AppDataSource.query('SELECT id, email, email_verified, created_at FROM users ORDER BY created_at DESC LIMIT 10');
    
    console.log('\n📋 Recent Users:');
    console.log('================');
    users.forEach((user: any) => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Verified: ${user.email_verified}`);
      console.log(`Created: ${user.created_at}`);
      console.log('---');
    });

    // Check user roles
    const roles = await AppDataSource.query('SELECT ur.id, ur.user_id, ur.role, u.email FROM user_roles ur LEFT JOIN users u ON ur.user_id = u.id ORDER BY ur.created_at DESC LIMIT 10');
    
    console.log('\n👤 User Roles:');
    console.log('================');
    roles.forEach((role: any) => {
      console.log(`User: ${role.email || 'N/A'} (${role.user_id})`);
      console.log(`Role: ${role.role}`);
      console.log('---');
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUser();
