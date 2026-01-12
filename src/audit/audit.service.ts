import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

interface LogData {
  user_id?: string;
  action: string;
  target_user_id?: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: LogData): Promise<AuditLog> {
    const log = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(log);
  }

  async findByUser(userId: string, limit = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findByAction(action: string, limit = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { action },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findAll(limit = 100, offset = 0): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
