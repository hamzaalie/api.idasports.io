import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
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

async function updateForeignKeys() {
  console.log('Connecting to database...');
  await dataSource.initialize();
  
  console.log('Updating foreign key constraints...');
  
  try {
    // Update audit_logs foreign keys to SET NULL on delete
    await dataSource.query(`
      ALTER TABLE audit_logs 
      DROP CONSTRAINT IF EXISTS "FK_bd2726fd31b35443f2245b93ba0"
    `);
    
    await dataSource.query(`
      ALTER TABLE audit_logs
      ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    `);
    
    console.log('✓ Updated audit_logs.user_id constraint');
    
    // Update target_user_id in audit_logs
    await dataSource.query(`
      ALTER TABLE audit_logs 
      DROP CONSTRAINT IF EXISTS "FK_audit_logs_target_user"
    `);
    
    await dataSource.query(`
      ALTER TABLE audit_logs
      ADD CONSTRAINT "FK_audit_logs_target_user" 
      FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
    `);
    
    console.log('✓ Updated audit_logs.target_user_id constraint');
    
    // Update user_roles assigned_by
    const userRolesConstraints = await dataSource.query(`
      SELECT constraint_name 
      FROM information_schema.key_column_usage 
      WHERE table_name = 'user_roles' 
      AND column_name = 'assigned_by'
    `);
    
    for (const row of userRolesConstraints) {
      await dataSource.query(`ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`);
    }
    
    await dataSource.query(`
      ALTER TABLE user_roles
      ADD CONSTRAINT "FK_user_roles_assigned_by" 
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
    `);
    
    console.log('✓ Updated user_roles.assigned_by constraint');
    
    // Update payments
    const paymentsConstraints = await dataSource.query(`
      SELECT constraint_name 
      FROM information_schema.key_column_usage 
      WHERE table_name = 'payments' 
      AND column_name = 'user_id'
    `);
    
    for (const row of paymentsConstraints) {
      await dataSource.query(`ALTER TABLE payments DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`);
    }
    
    await dataSource.query(`
      ALTER TABLE payments
      ADD CONSTRAINT "FK_payments_user_id" 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);
    
    console.log('✓ Updated payments.user_id constraint');
    
    // Update invoices
    const invoicesConstraints = await dataSource.query(`
      SELECT constraint_name 
      FROM information_schema.key_column_usage 
      WHERE table_name = 'invoices' 
      AND column_name = 'user_id'
    `);
    
    for (const row of invoicesConstraints) {
      await dataSource.query(`ALTER TABLE invoices DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`);
    }
    
    await dataSource.query(`
      ALTER TABLE invoices
      ADD CONSTRAINT "FK_invoices_user_id" 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);
    
    console.log('✓ Updated invoices.user_id constraint');
    
    console.log('\n✅ All foreign key constraints updated successfully!');
    
    // Verify the changes
    const constraints = await dataSource.query(`
      SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'users'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    console.log('\nCurrent Foreign Key Constraints:');
    console.table(constraints);
    
  } catch (error) {
    console.error('Error updating constraints:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

updateForeignKeys()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
