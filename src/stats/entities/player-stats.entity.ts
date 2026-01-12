import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { Match } from '../../matches/entities/match.entity';

@Entity('player_stats')
@Unique(['player_id', 'match_id'])
export class PlayerStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  player_id: number;

  @ManyToOne(() => Player, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column()
  match_id: number;

  @ManyToOne(() => Match, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  // Playing time
  @Column({ default: 0 })
  minutes_played: number;

  @Column({ default: false })
  starting_xi: boolean;

  // Offensive stats
  @Column({ default: 0 })
  goals: number;

  @Column({ default: 0 })
  assists: number;

  @Column({ default: 0 })
  shots: number;

  @Column({ default: 0 })
  shots_on_target: number;

  // Passing stats
  @Column({ default: 0 })
  passes_completed: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  pass_accuracy: number;

  @Column({ default: 0 })
  key_passes: number;

  @Column({ default: 0 })
  long_balls: number;

  @Column({ default: 0 })
  crosses: number;

  // Defensive stats
  @Column({ default: 0 })
  tackles: number;

  @Column({ default: 0 })
  interceptions: number;

  @Column({ default: 0 })
  blocks: number;

  @Column({ default: 0 })
  clearances: number;

  // Physical stats
  @Column({ default: 0, nullable: true })
  duels_won: number;

  @Column({ default: 0, nullable: true })
  dribbles_successful: number;

  // Disciplinary
  @Column({ default: 0 })
  fouls_committed: number;

  @Column({ default: 0 })
  fouls_suffered: number;

  @Column({ default: 0 })
  yellow_cards: number;

  @Column({ default: 0 })
  red_cards: number;

  // Video highlights
  @Column({ type: 'text', nullable: true })
  highlights_video_url: string;

  // Goalkeeper specific
  @Column({ default: 0 })
  saves: number;

  @Column({ default: 0 })
  gk_runs_out: number;

  @Column({ default: 0 })
  successful_punches: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
