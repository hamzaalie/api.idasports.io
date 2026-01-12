import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { User } from '../../users/entities/user.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  home_team_id: number;

  @ManyToOne(() => Team, { nullable: false })
  @JoinColumn({ name: 'home_team_id' })
  home_team: Team;

  @Column()
  away_team_id: number;

  @ManyToOne(() => Team, { nullable: false })
  @JoinColumn({ name: 'away_team_id' })
  away_team: Team;

  @Column({ length: 100 })
  competition: string;

  @Column({ default: 0 })
  home_score: number;

  @Column({ default: 0 })
  away_score: number;

  @Column()
  match_date: Date;

  @Column({ length: 255 })
  venue: string;

  @Column({ type: 'text', nullable: true })
  video_url: string;

  @Column({ length: 20, default: 'Other' })
  video_platform: string; // YouTube, Vimeo, VEO, Other

  @Column({ length: 20, default: 'Scheduled' })
  status: string; // Scheduled, Completed, Cancelled

  @Column({ nullable: true })
  created_by_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
