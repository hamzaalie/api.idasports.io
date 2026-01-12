import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const migrationDir = path.join(__dirname, '..', 'migration-data');

  try {
    console.log('Starting M3 data import...\n');

    // Import teams
    console.log('Importing teams...');
    const teamsData = JSON.parse(
      fs.readFileSync(path.join(migrationDir, 'teams.json'), 'utf8'),
    );
    
    for (const team of teamsData) {
      await dataSource.query(
        `INSERT INTO teams (id, name, logo, location, founded_year, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           logo = EXCLUDED.logo,
           location = EXCLUDED.location,
           founded_year = EXCLUDED.founded_year,
           updated_at = EXCLUDED.updated_at`,
        [
          team.id,
          team.name,
          team.logo,
          team.location,
          team.founded_year,
          team.created_at,
          team.updated_at,
        ],
      );
    }
    console.log(`  ✓ Imported ${teamsData.length} teams\n`);

    // Import players
    console.log('Importing players...');
    const playersData = JSON.parse(
      fs.readFileSync(path.join(migrationDir, 'players.json'), 'utf8'),
    );
    
    for (const player of playersData) {
      await dataSource.query(
        `INSERT INTO players (id, name, date_of_birth, nationality, position, jersey_number,
                              preferred_foot, height, weight, bio, team_id, user_id, 
                              created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           date_of_birth = EXCLUDED.date_of_birth,
           nationality = EXCLUDED.nationality,
           position = EXCLUDED.position,
           jersey_number = EXCLUDED.jersey_number,
           preferred_foot = EXCLUDED.preferred_foot,
           height = EXCLUDED.height,
           weight = EXCLUDED.weight,
           bio = EXCLUDED.bio,
           team_id = EXCLUDED.team_id,
           updated_at = EXCLUDED.updated_at`,
        [
          player.id,
          player.name,
          player.date_of_birth,
          player.nationality,
          player.position,
          player.jersey_number,
          player.preferred_foot,
          player.height,
          player.weight,
          player.bio,
          player.team_id,
          player.user_id,
          player.created_at,
          player.updated_at,
        ],
      );
    }
    console.log(`  ✓ Imported ${playersData.length} players\n`);

    // Import matches
    console.log('Importing matches...');
    const matchesData = JSON.parse(
      fs.readFileSync(path.join(migrationDir, 'matches.json'), 'utf8'),
    );
    
    for (const match of matchesData) {
      await dataSource.query(
        `INSERT INTO matches (id, home_team_id, away_team_id, competition, match_date,
                              venue, home_score, away_score, video_url, video_platform,
                              status, created_by_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           home_team_id = EXCLUDED.home_team_id,
           away_team_id = EXCLUDED.away_team_id,
           competition = EXCLUDED.competition,
           match_date = EXCLUDED.match_date,
           venue = EXCLUDED.venue,
           home_score = EXCLUDED.home_score,
           away_score = EXCLUDED.away_score,
           video_url = EXCLUDED.video_url,
           video_platform = EXCLUDED.video_platform,
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at`,
        [
          match.id,
          match.home_team_id,
          match.away_team_id,
          match.competition,
          match.match_date,
          match.venue,
          match.home_score,
          match.away_score,
          match.video_url,
          match.video_platform,
          match.status,
          match.created_by_id,
          match.created_at,
          match.updated_at,
        ],
      );
    }
    console.log(`  ✓ Imported ${matchesData.length} matches\n`);

    // Import player stats
    console.log('Importing player statistics...');
    const playerStatsData = JSON.parse(
      fs.readFileSync(path.join(migrationDir, 'player_stats.json'), 'utf8'),
    );
    
    for (const stats of playerStatsData) {
      await dataSource.query(
        `INSERT INTO player_stats (
           id, player_id, match_id, minutes_played, starting_xi,
           goals, assists, shots, shots_on_target,
           passes_completed, pass_accuracy, key_passes, long_balls, crosses,
           tackles, interceptions, blocks, clearances,
           duels_won, dribbles_successful,
           fouls_committed, fouls_suffered, yellow_cards, red_cards,
           highlights_video_url, saves, gk_runs_out, successful_punches,
           created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                 $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
         ON CONFLICT (player_id, match_id) DO UPDATE SET
           minutes_played = EXCLUDED.minutes_played,
           starting_xi = EXCLUDED.starting_xi,
           goals = EXCLUDED.goals,
           assists = EXCLUDED.assists,
           shots = EXCLUDED.shots,
           shots_on_target = EXCLUDED.shots_on_target,
           passes_completed = EXCLUDED.passes_completed,
           pass_accuracy = EXCLUDED.pass_accuracy,
           key_passes = EXCLUDED.key_passes,
           long_balls = EXCLUDED.long_balls,
           crosses = EXCLUDED.crosses,
           tackles = EXCLUDED.tackles,
           interceptions = EXCLUDED.interceptions,
           blocks = EXCLUDED.blocks,
           clearances = EXCLUDED.clearances,
           duels_won = EXCLUDED.duels_won,
           dribbles_successful = EXCLUDED.dribbles_successful,
           fouls_committed = EXCLUDED.fouls_committed,
           fouls_suffered = EXCLUDED.fouls_suffered,
           yellow_cards = EXCLUDED.yellow_cards,
           red_cards = EXCLUDED.red_cards,
           highlights_video_url = EXCLUDED.highlights_video_url,
           saves = EXCLUDED.saves,
           gk_runs_out = EXCLUDED.gk_runs_out,
           successful_punches = EXCLUDED.successful_punches,
           updated_at = EXCLUDED.updated_at`,
        [
          stats.id, stats.player_id, stats.match_id, stats.minutes_played, stats.starting_xi,
          stats.goals, stats.assists, stats.shots, stats.shots_on_target,
          stats.passes_completed, stats.pass_accuracy, stats.key_passes, stats.long_balls, stats.crosses,
          stats.tackles, stats.interceptions, stats.blocks, stats.clearances,
          stats.duels_won, stats.dribbles_successful,
          stats.fouls_committed, stats.fouls_suffered, stats.yellow_cards, stats.red_cards,
          stats.highlights_video_url, stats.saves, stats.gk_runs_out, stats.successful_punches,
          stats.created_at, stats.updated_at,
        ],
      );
    }
    console.log(`  ✓ Imported ${playerStatsData.length} player stats records\n`);

    // Import team match stats
    console.log('Importing team match statistics...');
    const teamStatsData = JSON.parse(
      fs.readFileSync(path.join(migrationDir, 'team_stats.json'), 'utf8'),
    );
    
    for (const stats of teamStatsData) {
      await dataSource.query(
        `INSERT INTO team_match_stats (
           id, match_id, team_id,
           goals, key_passes, long_balls, total_shots, shots_on_target,
           possession_percentage, passes_in_penalty_area,
           tackles, blocks,
           successful_dribbles, duels_won, miscontrols, fouled_when_dribble,
           fouls, yellow_cards, red_cards,
           created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
         ON CONFLICT (id) DO UPDATE SET
           match_id = EXCLUDED.match_id,
           team_id = EXCLUDED.team_id,
           goals = EXCLUDED.goals,
           key_passes = EXCLUDED.key_passes,
           long_balls = EXCLUDED.long_balls,
           total_shots = EXCLUDED.total_shots,
           shots_on_target = EXCLUDED.shots_on_target,
           possession_percentage = EXCLUDED.possession_percentage,
           passes_in_penalty_area = EXCLUDED.passes_in_penalty_area,
           tackles = EXCLUDED.tackles,
           blocks = EXCLUDED.blocks,
           successful_dribbles = EXCLUDED.successful_dribbles,
           duels_won = EXCLUDED.duels_won,
           miscontrols = EXCLUDED.miscontrols,
           fouled_when_dribble = EXCLUDED.fouled_when_dribble,
           fouls = EXCLUDED.fouls,
           yellow_cards = EXCLUDED.yellow_cards,
           red_cards = EXCLUDED.red_cards,
           updated_at = EXCLUDED.updated_at`,
        [
          stats.id, stats.match_id, stats.team_id,
          stats.goals, stats.key_passes, stats.long_balls, stats.total_shots, stats.shots_on_target,
          stats.possession_percentage, stats.passes_in_penalty_area,
          stats.tackles, stats.blocks,
          stats.successful_dribbles, stats.duels_won, stats.miscontrols, stats.fouled_when_dribble,
          stats.fouls, stats.yellow_cards, stats.red_cards,
          stats.created_at, stats.updated_at,
        ],
      );
    }
    console.log(`  ✓ Imported ${teamStatsData.length} team stats records\n`);

    console.log('✅ Migration complete!');
    console.log('\nSummary:');
    console.log(`  - ${teamsData.length} teams`);
    console.log(`  - ${playersData.length} players`);
    console.log(`  - ${matchesData.length} matches`);
    console.log(`  - ${playerStatsData.length} player statistics`);
    console.log(`  - ${teamStatsData.length} team statistics`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
