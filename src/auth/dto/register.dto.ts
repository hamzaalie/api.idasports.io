import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ 
    example: 'subscriber', 
    enum: ['subscriber', 'super_admin', 'support_admin', 'read_only_admin', 'player', 'scout', 'admin', 'limited_user'],
    required: false,
    description: 'User role - defaults to subscriber if not provided. Accepts both backend roles (subscriber, super_admin, etc.) and frontend roles (player, scout, admin)'
  })
  @IsOptional()
  @IsString()
  @IsIn(['subscriber', 'super_admin', 'support_admin', 'read_only_admin', 'player', 'scout', 'admin', 'limited_user'])
  role?: string;

  @ApiProperty({ 
    example: 'v1', 
    enum: ['v1', 'm3'],
    required: false,
    description: 'Platform where user is registering from - v1 or m3. Used to send correct verification link.'
  })
  @IsOptional()
  @IsString()
  @IsIn(['v1', 'm3'])
  platform?: 'v1' | 'm3';

  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Password123!', required: false, description: 'Password confirmation (ignored, for frontend compatibility)' })
  @IsOptional()
  @IsString()
  password2?: string;
}
