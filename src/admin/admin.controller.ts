import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UserRole } from '../users/entities/user-role.entity';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.READ_ONLY_ADMIN)
  async listUsers(
    @Query('role') role?: UserRole,
    @Query('subscriptionStatus') subscriptionStatus?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listUsers({ 
      role, 
      subscriptionStatus, 
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('users/:id/roles')
  @Roles(UserRole.SUPER_ADMIN)
  async assignRole(
    @Request() req,
    @Param('id') targetUserId: string,
    @Body() body: { role: UserRole },
  ) {
    return this.adminService.assignRole(req.user.userId, targetUserId, body.role);
  }

  @Delete('users/:id/roles/:role')
  @Roles(UserRole.SUPER_ADMIN)
  async removeRole(
    @Request() req,
    @Param('id') targetUserId: string,
    @Param('role') role: UserRole,
  ) {
    return this.adminService.removeRole(req.user.userId, targetUserId, role);
  }

  @Patch('users/:id/subscription')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  async overrideSubscription(
    @Request() req,
    @Param('id') targetUserId: string,
    @Body() body: { action: 'activate' | 'cancel'; durationDays?: number },
  ) {
    return this.adminService.overrideSubscription(
      req.user.userId,
      targetUserId,
      body.action,
      body.durationDays,
    );
  }

  @Get('audit-logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.READ_ONLY_ADMIN)
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAuditLogs({ userId, action, limit });
  }

  @Delete('users/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async deleteUser(
    @Request() req,
    @Param('id') targetUserId: string,
  ) {
    return this.adminService.deleteUser(req.user.userId, targetUserId);
  }

  @Get('payments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.READ_ONLY_ADMIN)
  async listPayments(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listPayments({ 
      status, 
      userId, 
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('subscriptions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.READ_ONLY_ADMIN)
  async listSubscriptions(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listSubscriptions({ 
      status, 
      userId, 
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('invoices')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.READ_ONLY_ADMIN)
  async listInvoices(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listInvoices({ 
      status, 
      userId, 
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Patch('invoices/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  async updateInvoice(
    @Param('id') invoiceId: string,
    @Body() body: any,
  ) {
    return this.adminService.updateInvoice(invoiceId, body);
  }

  @Get('invoices/:id/download')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.READ_ONLY_ADMIN)
  async downloadInvoice(
    @Param('id') invoiceId: string,
  ) {
    return this.adminService.downloadInvoice(invoiceId);
  }

  @Get('settings/payment-gateways')
  @Roles(UserRole.SUPER_ADMIN)
  async getPaymentGatewaySettings() {
    return this.adminService.getPaymentGatewaySettings();
  }

  @Post('settings/payment-gateways')
  @Roles(UserRole.SUPER_ADMIN)
  async updatePaymentGatewaySettings(
    @Body() body: any,
  ) {
    return this.adminService.updatePaymentGatewaySettings(body);
  }

  @Post('settings/payment-gateways/:gateway/test')
  @Roles(UserRole.SUPER_ADMIN)
  async testPaymentGateway(
    @Param('gateway') gateway: string,
    @Body() body: any,
  ) {
    return this.adminService.testPaymentGateway(gateway, body);
  }
}
