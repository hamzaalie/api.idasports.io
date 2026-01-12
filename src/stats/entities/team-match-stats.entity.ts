import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { Match } from '../../matches/entities/match.entity';

@Entity('team_match_stats')
export class TeamMatchStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  match_id: number;

  @ManyToOne(() => Match, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column()
  team_id: number;

  @ManyToOne(() => Team, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  // Offensive statistics
  @Column({ default: 0 })
  goals: number;

  @Column({ default: 0 })
  key_passes: number;

  @Column({ default: 0 })
  long_balls: number;

  @Column({ default: 0 })
  total_shots: number;

  @Column({ default: 0 })
  shots_on_target: number;

  // Possession and passing
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  possession_percentage: number;

  @Column({ default: 0 })
  passes_in_penalty_area: number;

  // Defensive statistics
  @Column({ default: 0 })
  tackles: number;

  @Column({ default: 0 })
  blocks: number;

  // Physical and skill statistics
  @Column({ default: 0 })
  successful_dribbles: number;

  @Column({ default: 0 })
  duels_won: number;

  @Column({ default: 0 })
  miscontrols: number;

  @Column({ default: 0 })
  fouled_when_dribble: number;

  // Disciplinary
  @Column({ default: 0 })
  fouls: number;

  @Column({ default: 0 })
  yellow_cards: number;

  @Column({ default: 0 })
  red_cards: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
