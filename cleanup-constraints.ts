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

async function cleanupDuplicateConstraints() {
  console.log('Connecting to database...');
  await dataSource.initialize();
  
  console.log('Cleaning up duplicate constraints...');
  
  try {
    // Get all constraints on audit_logs.target_user_id
    const constraints = await dataSource.query(`
      SELECT tc.constraint_name, rc.delete_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name = 'audit_logs' 
        AND kcu.column_name = 'target_user_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
    
    console.log('Found constraints:', constraints);
    
    // Drop the NO ACTION constraint
    for (const constraint of constraints) {
      if (constraint.delete_rule === 'NO ACTION') {
        await dataSource.query(`ALTER TABLE audit_logs DROP CONSTRAINT "${constraint.constraint_name}"`);
        console.log(`✓ Dropped duplicate constraint: ${constraint.constraint_name}`);
      }
    }
    
    console.log('\n✅ Cleanup complete!');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

cleanupDuplicateConstraints()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
