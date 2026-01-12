import { DataSource } from 'typeorm';
import { UserRole } from './src/users/entities/user-role.entity';

/**
 * Script to assign subscriber role to users with active subscriptions
 * Run this to fix existing users who purchased subscriptions before role assignment was implemented
 */

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'central_backend',
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function assignSubscriberRole() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    // Find all users with active subscriptions but no subscriber role
    const query = `
      SELECT DISTINCT u.id, u.email, s.status, s.expires_at
      FROM users u
      INNER JOIN subscriptions s ON s.user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'subscriber'
      WHERE s.status = 'active' 
        AND ur.id IS NULL
    `;

    const usersWithoutRole = await AppDataSource.query(query);

    console.log(`Found ${usersWithoutRole.length} users with active subscriptions but no subscriber role\n`);

    if (usersWithoutRole.length === 0) {
      console.log('✅ All users with active subscriptions already have subscriber role!');
      await AppDataSource.destroy();
      return;
    }

    // Assign subscriber role to each user
    for (const user of usersWithoutRole) {
      console.log(`📝 Assigning subscriber role to: ${user.email} (${user.id})`);
      console.log(`   Subscription status: ${user.status}, expires: ${user.expires_at}`);

      await AppDataSource.query(
        `INSERT INTO user_roles (user_id, role, assigned_by, assigned_at) 
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT DO NOTHING`,
        [user.id, UserRole.SUBSCRIBER, 'system']
      );

      console.log(`   ✅ Subscriber role assigned!\n`);
    }

    console.log('🎉 All users updated successfully!');
    console.log('\nPlease refresh your browser and try again.');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignSubscriberRole();
