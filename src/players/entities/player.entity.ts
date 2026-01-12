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

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column()
  date_of_birth: Date;

  @Column({ length: 100 })
  nationality: string;

  @Column({ length: 50 })
  position: string;

  @Column({ type: 'int', nullable: true })
  jersey_number: number;

  @Column({ length: 20, nullable: true })
  preferred_foot: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  photo: string;

  @Column({ nullable: true })
  team_id: number;

  @ManyToOne(() => Team, (team) => team.players, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ nullable: true })
  user_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
