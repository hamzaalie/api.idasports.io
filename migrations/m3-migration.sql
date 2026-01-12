-- M3 Migration: Create stats tables and update existing tables
-- Run this SQL script on your PostgreSQL database

-- 1. Add missing columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS jersey_number INTEGER;

-- 2. Add missing columns to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS competition VARCHAR(100) DEFAULT 'Friendly';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS video_platform VARCHAR(20) DEFAULT 'Other';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_by_id VARCHAR(255);

-- 3. Create player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL,
  match_id INTEGER NOT NULL,
  minutes_played INTEGER DEFAULT 0,
  starting_xi BOOLEAN DEFAULT false,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  shots INTEGER DEFAULT 0,
  shots_on_target INTEGER DEFAULT 0,
  passes_completed INTEGER DEFAULT 0,
  pass_accuracy DECIMAL(5,2) DEFAULT 0,
  key_passes INTEGER DEFAULT 0,
  long_balls INTEGER DEFAULT 0,
  crosses INTEGER DEFAULT 0,
  tackles INTEGER DEFAULT 0,
  interceptions INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  clearances INTEGER DEFAULT 0,
  duels_won INTEGER,
  dribbles_successful INTEGER,
  fouls_committed INTEGER DEFAULT 0,
  fouls_suffered INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  highlights_video_url TEXT,
  saves INTEGER DEFAULT 0,
  gk_runs_out INTEGER DEFAULT 0,
  successful_punches INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT player_stats_player_fk FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT player_stats_match_fk FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  CONSTRAINT player_stats_unique UNIQUE(player_id, match_id)
);

-- 4. Create team_match_stats table
CREATE TABLE IF NOT EXISTS team_match_stats (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  goals INTEGER DEFAULT 0,
  key_passes INTEGER DEFAULT 0,
  long_balls INTEGER DEFAULT 0,
  total_shots INTEGER DEFAULT 0,
  shots_on_target INTEGER DEFAULT 0,
  possession_percentage DECIMAL(5,2) DEFAULT 0,
  passes_in_penalty_area INTEGER DEFAULT 0,
  tackles INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  successful_dribbles INTEGER DEFAULT 0,
  duels_won INTEGER DEFAULT 0,
  miscontrols INTEGER DEFAULT 0,
  fouled_when_dribble INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT team_match_stats_match_fk FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  CONSTRAINT team_match_stats_team_fk FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 5. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_match ON player_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_team_match_stats_match ON team_match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_team_match_stats_team ON team_match_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- 6. Create or update foreign key constraints on matches table
DO $$
BEGIN
  -- Add foreign key for home_team_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'matches_home_team_fk'
  ) THEN
    ALTER TABLE matches ADD CONSTRAINT matches_home_team_fk 
      FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE RESTRICT;
  END IF;

  -- Add foreign key for away_team_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'matches_away_team_fk'
  ) THEN
    ALTER TABLE matches ADD CONSTRAINT matches_away_team_fk 
      FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE RESTRICT;
  END IF;

  -- Add foreign key for created_by_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'matches_created_by_fk'
  ) THEN
    ALTER TABLE matches ADD CONSTRAINT matches_created_by_fk 
      FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 7. Add check constraints for data validation
ALTER TABLE player_stats 
  ADD CONSTRAINT IF NOT EXISTS player_stats_minutes_check 
  CHECK (minutes_played >= 0 AND minutes_played <= 120);

ALTER TABLE player_stats 
  ADD CONSTRAINT IF NOT EXISTS player_stats_pass_accuracy_check 
  CHECK (pass_accuracy >= 0 AND pass_accuracy <= 100);

ALTER TABLE player_stats 
  ADD CONSTRAINT IF NOT EXISTS player_stats_red_cards_check 
  CHECK (red_cards >= 0 AND red_cards <= 1);

ALTER TABLE team_match_stats 
  ADD CONSTRAINT IF NOT EXISTS team_match_stats_possession_check 
  CHECK (possession_percentage >= 0 AND possession_percentage <= 100);

-- 8. Grant permissions (adjust user as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON player_stats TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON team_match_stats TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE player_stats_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE team_match_stats_id_seq TO your_app_user;

-- Migration complete!
-- Next steps:
-- 1. Run the Python export script: python export-m3-data.py
-- 2. Run the TypeScript import script: cd central-backend && npm run migration:import
