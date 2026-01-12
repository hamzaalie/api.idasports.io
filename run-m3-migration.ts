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
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Add jersey_number to players
    await dataSource.query(`
      ALTER TABLE players ADD COLUMN IF NOT EXISTS jersey_number INTEGER;
    `);
    console.log('✅ Added jersey_number to players');

    // Add created_by_id to matches
    await dataSource.query(`
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES users(id) ON DELETE SET NULL;
    `);
    console.log('✅ Added created_by_id to matches');

    // Add video fields to matches
    await dataSource.query(`
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);
    `);
    await dataSource.query(`
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS video_platform VARCHAR(50);
    `);
    console.log('✅ Added video fields to matches');

    // Add competition to matches
    await dataSource.query(`
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS competition VARCHAR(200);
    `);
    console.log('✅ Added competition to matches');

    // Create indexes
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_matches_created_by ON matches(created_by_id);
    `);
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_players_jersey_number ON players(jersey_number);
    `);
    console.log('✅ Created indexes');

    console.log('\n🎉 Migration completed successfully!');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runMigration();
