-- Add missing columns for M3 integration

-- Add jersey_number to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS jersey_number INTEGER;

-- Add created_by_id to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add video_url and video_platform to matches table if not exists
ALTER TABLE matches ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS video_platform VARCHAR(50);

-- Add competition to matches table if not exists
ALTER TABLE matches ADD COLUMN IF NOT EXISTS competition VARCHAR(200);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON matches(created_by_id);
CREATE INDEX IF NOT EXISTS idx_players_jersey_number ON players(jersey_number);
