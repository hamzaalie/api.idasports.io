export enum UserRole {
  SUBSCRIBER = 'subscriber',
  LIMITED_USER = 'limited_user',
  SUPER_ADMIN = 'super_admin',
  SUPPORT_ADMIN = 'support_admin',
  READ_ONLY_ADMIN = 'read_only_admin',
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_roles')
@Unique(['user_id', 'role'])
export class UserRoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @CreateDateColumn()
  assigned_at: Date;

  @Column('uuid', { nullable: true })
  assigned_by: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_by' })
  assigner: User;
}
