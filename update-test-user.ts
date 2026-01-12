import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'ep-frosty-morning-ada4bm2t-pooler.c-2.us-east-1.aws.neon.tech',
  port: 5432,
  username: 'neondb_owner',
  password: 'npg_XA8stHTxu9EY',
  database: 'neondb',
  ssl: { rejectUnauthorized: false },
});

async function updateTestUser() {
  await AppDataSource.initialize();
  
  const userId = '44a76105-e280-433b-bb07-fa4165d06ff4';
  
  // Add super_admin role
  await AppDataSource.query(`
    INSERT INTO user_roles (id, user_id, role)
    VALUES (gen_random_uuid(), $1, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING
  `, [userId]);
  
  // Create/update subscription
  const existingSub = await AppDataSource.query(
    `SELECT id FROM subscriptions WHERE user_id = $1`,
    [userId]
  );
  
  if (existingSub.length > 0) {
    await AppDataSource.query(`
      UPDATE subscriptions 
      SET status = 'active', 
          expires_at = NOW() + INTERVAL '365 days',
          auto_renew = true,
          updated_at = NOW()
      WHERE user_id = $1
    `, [userId]);
  } else {
    await AppDataSource.query(`
      INSERT INTO subscriptions (user_id, status, starts_at, expires_at, auto_renew, created_at, updated_at)
      VALUES ($1, 'active', NOW(), NOW() + INTERVAL '365 days', true, NOW(), NOW())
    `, [userId]);
  }
  
  console.log('✅ Test user updated successfully!');
  console.log('   - Admin role granted');
  console.log('   - Active subscription created (expires in 365 days)');
  
  await AppDataSource.destroy();
}

updateTestUser().catch(console.error);
