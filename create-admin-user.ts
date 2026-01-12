import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Script to create an admin user for the admin panel
 * Creates a user and assigns super_admin role
 */

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createAdminUser() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    // Admin credentials
    const email = 'admin@scoutingplatform.com';
    const password = 'Admin123!';

    console.log('📝 Creating admin user...');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('⚠️  Please change this password after first login!\n');

    // Check if user already exists
    const existingUsers = await AppDataSource.query(
      `SELECT id, email FROM users WHERE email = $1`,
      [email]
    );

    let userId: string;

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log(`👤 User already exists: ${email} (ID: ${userId})`);
      
      // Update password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      await AppDataSource.query(
        `UPDATE users SET password_hash = $1, email_verified = true WHERE id = $2`,
        [passwordHash, userId]
      );
      console.log('✅ Password updated and email verified\n');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const result = await AppDataSource.query(
        `INSERT INTO users (email, password_hash, email_verified, created_at, updated_at) 
         VALUES ($1, $2, true, NOW(), NOW()) 
         RETURNING id`,
        [email, passwordHash]
      );

      userId = result[0].id;
      console.log(`✅ User created: ${email} (ID: ${userId})\n`);
    }

    // Assign super_admin role
    console.log('📝 Assigning super_admin role...');
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, role, assigned_at) 
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, role) DO NOTHING`,
      [userId, 'super_admin']
    );

    // Verify roles
    const roles = await AppDataSource.query(
      `SELECT role FROM user_roles WHERE user_id = $1`,
      [userId]
    );

    console.log('✅ Super admin role assigned successfully!');
    console.log(`\n📋 User roles: ${roles.map((r: any) => r.role).join(', ')}\n`);
    
    console.log('🎉 Admin user is ready!');
    console.log('\n📌 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 Admin Panel: http://localhost:3001');
    console.log('⚠️  Remember to change the password after first login!\n');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get email and password from command line arguments or use defaults
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === '--help') {
  console.log('\n📖 Usage:');
  console.log('   npm run create-admin');
  console.log('\nThis will create an admin user with:');
  console.log('   Email: admin@scoutingplatform.com');
  console.log('   Password: Admin123!');
  console.log('   Role: super_admin\n');
  process.exit(0);
}

createAdminUser();
