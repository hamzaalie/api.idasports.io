require('dotenv').config();
const { Client } = require('pg');

async function assignSubscriberRole() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Find users with active subscriptions but no subscriber role
    const checkQuery = `
      SELECT DISTINCT u.id, u.email, s.status, s.expires_at
      FROM users u
      INNER JOIN subscriptions s ON s.user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'subscriber'
      WHERE s.status = 'active' 
        AND ur.id IS NULL
    `;

    const { rows: users } = await client.query(checkQuery);
    console.log(`Found ${users.length} users needing subscriber role\n`);

    if (users.length === 0) {
      console.log('✅ All users already have subscriber role!');
      await client.end();
      return;
    }

    // Assign roles
    for (const user of users) {
      console.log(`📝 Assigning to: ${user.email}`);
      console.log(`   Status: ${user.status}, Expires: ${new Date(user.expires_at).toLocaleDateString()}`);
      
      await client.query(
        `INSERT INTO user_roles (user_id, role) 
         VALUES ($1, $2)`,
        [user.id, 'subscriber']
      );
      
      console.log(`   ✅ Role assigned!\n`);
    }

    console.log('🎉 Success! Please refresh your browser.');

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

assignSubscriberRole();
