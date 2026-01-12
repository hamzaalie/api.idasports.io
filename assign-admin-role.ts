import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';

/**
 * Script to assign admin role to a specific user
 * This gives the user full access to all M3 features
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

async function assignAdminRole(email: string) {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    // Find user by email
    const users = await AppDataSource.query(
      `SELECT id, email FROM users WHERE email = $1`,
      [email]
    );

    if (users.length === 0) {
      console.log(`❌ User not found: ${email}`);
      await AppDataSource.destroy();
      return;
    }

    const user = users[0];
    console.log(`👤 Found user: ${user.email} (ID: ${user.id})\n`);

    // Check existing roles
    const existingRoles = await AppDataSource.query(
      `SELECT role FROM user_roles WHERE user_id = $1`,
      [user.id]
    );

    console.log(`Current roles: ${existingRoles.map((r: any) => r.role).join(', ') || 'None'}\n`);

    // Assign admin role
    console.log('📝 Assigning admin role...');
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, role, assigned_by, assigned_at) 
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, role) DO NOTHING`,
      [user.id, 'admin', 'system']
    );

    // Verify the role was assigned
    const updatedRoles = await AppDataSource.query(
      `SELECT role FROM user_roles WHERE user_id = $1`,
      [user.id]
    );

    console.log('✅ Admin role assigned successfully!');
    console.log(`\n📋 Updated roles: ${updatedRoles.map((r: any) => r.role).join(', ')}\n`);
    console.log('🎉 User now has full admin access to M3 platform!');
    console.log('\n⚠️  Please log out and log back in to refresh your token.\n');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2] || 'riseinnovateri@gmail.com';

console.log(`\n🚀 Assigning admin role to: ${email}\n`);
assignAdminRole(email);
