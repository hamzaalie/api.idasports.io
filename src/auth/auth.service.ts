import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { UserRole } from '../users/entities/user-role.entity';

export interface JwtPayload {
  userId: string;
  email: string;
  roles: UserRole[];
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private emailService: EmailService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(
    email: string,
    password: string,
    ipAddress?: string,
    role?: string,
    platform?: 'v1' | 'm3',
  ): Promise<{ user: User; message: string }> {
    // Check if user exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(
      parseInt(this.configService.get('BCRYPT_ROUNDS') || '10'),
    );
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user (auto-verify in development)
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';
    const user = await this.usersService.create({
      email,
      password_hash: passwordHash,
      email_verification_token: isDevelopment ? null : verificationToken,
      email_verified: isDevelopment ? true : false,
    });

    // Map M3 frontend roles to central backend roles
    let backendRole: string;
    if (role === 'player') {
      backendRole = 'limited_user';
    } else if (role === 'scout') {
      backendRole = 'subscriber';
    } else if (role === 'admin') {
      backendRole = 'super_admin';
    } else {
      // If a backend role is passed directly, use it
      backendRole = role || 'subscriber';
    }

    await this.usersService.assignRole(user.id, backendRole as any);

    // Log registration
    await this.auditService.log({
      user_id: user.id,
      action: 'user_registered',
      ip_address: ipAddress,
      metadata: { email },
    });

    // Send verification email with platform info
    try {
      const emailPlatform = platform || 'm3'; // Default to m3 if not specified
      await this.emailService.sendVerificationEmail(email, verificationToken, emailPlatform);
    } catch (error) {
      const platformUrl = (platform || 'm3') === 'v1' ? 'http://localhost:3001' : 'http://localhost:5173';
      console.log(`\n📧 Verification Email (not sent - SMTP not configured):`);
      console.log(`   To: ${email}`);
      console.log(`   Token: ${verificationToken}`);
      console.log(`   Platform: ${(platform || 'm3').toUpperCase()}`);
      console.log(`   Verify URL: ${platformUrl}/verify-email?token=${verificationToken}\n`);
    }

    return {
      user,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      await this.auditService.log({
        action: 'login_failed',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { email, reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Email not found. Please check your email or register a new account.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await this.auditService.log({
        user_id: user.id,
        action: 'login_failed',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { reason: 'invalid_password' },
      });
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    if (!user.email_verified) {
      throw new UnauthorizedException('Email not verified. Please check your email inbox and verify your account before logging in.');
    }

    // Get user roles
    const roles = await this.usersService.getUserRoles(user.id);

    // Generate tokens
    const accessToken = await this.generateAccessToken(user, roles);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Log successful login
    await this.auditService.log({
      user_id: user.id,
      action: 'login_success',
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Return user with roles array (just the role strings for the response)
    return { 
      accessToken, 
      refreshToken, 
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        created_at: user.created_at,
        roles: roles,
      } as any,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersService.findByVerificationToken(token);
    
    if (!user) {
      // Token not found - either invalid or already used
      // Check if there's a recently verified user (token might have been cleared)
      throw new BadRequestException('Invalid or already used verification token. If you just verified your email, please proceed to login.');
    }

    // Check if already verified
    if (user.email_verified) {
      return { message: 'Email already verified. You can now log in.' };
    }

    // Verify that the token matches (double-check)
    if (user.email_verification_token !== token) {
      throw new BadRequestException('Invalid verification token');
    }

    // Mark as verified and clear the token
    await this.usersService.update(user.id, {
      email_verified: true,
      email_verification_token: null,
    });

    await this.auditService.log({
      user_id: user.id,
      action: 'email_verified',
    });

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email);
    } catch (error) {
      console.log(`\n✅ Welcome Email (not sent - SMTP not configured):`);
      console.log(`   To: ${user.email}\n`);
    }

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    await this.usersService.update(user.id, {
      password_reset_token: resetToken,
      password_reset_expires: resetExpires,
    });

    await this.auditService.log({
      user_id: user.id,
      action: 'password_reset_requested',
    });

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      console.log(`\n🔑 Password Reset Email (not sent - SMTP not configured):`);
      console.log(`   To: ${email}`);
      console.log(`   Token: ${resetToken}`);
      console.log(`   Reset URL: http://localhost:3001/reset-password?token=${resetToken}\n`);
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByResetToken(token);
    
    if (
      !user ||
      user.password_reset_token !== token ||
      user.password_reset_expires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(
      parseInt(this.configService.get('BCRYPT_ROUNDS') || '10'),
    );
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await this.usersService.update(user.id, {
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires: null,
    });

    await this.auditService.log({
      user_id: user.id,
      action: 'password_reset_completed',
    });

    return { message: 'Password reset successful' };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token_hash: tokenHash },
      relations: ['user'],
    });

    if (!storedToken || storedToken.revoked_at || storedToken.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.refreshTokenRepository.update(storedToken.id, {
      revoked_at: new Date(),
    });

    // Get user roles
    const roles = await this.usersService.getUserRoles(storedToken.user_id);

    // Generate new tokens
    const user = await this.usersService.findById(storedToken.user_id);
    const newAccessToken = await this.generateAccessToken(user, roles);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    const tokenHash = this.hashToken(refreshToken);

    await this.refreshTokenRepository.update(
      { token_hash: tokenHash },
      { revoked_at: new Date() },
    );

    return { message: 'Logged out successfully' };
  }

  private async generateAccessToken(
    user: User,
    roles: UserRole[],
  ): Promise<string> {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      roles,
    };

    return this.jwtService.sign(payload);
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(token);

    const expiresAt = new Date();
    const days = parseInt(
      this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION')?.replace('d', '') ||
        '7',
    );
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.refreshTokenRepository.save({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    return token;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
