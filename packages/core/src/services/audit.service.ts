import { sql, eq } from 'drizzle-orm';
import { auditLog } from '@openfsm/db';
import type { Database } from '@openfsm/db';

export class AuditService {
  constructor(private db: Database) {}

  async log(entry: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    changes?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.db.insert(auditLog).values(entry);
  }

  async getByEntity(entityType: string, entityId: string) {
    return this.db.select().from(auditLog)
      .where(sql`${auditLog.entityType} = ${entityType} AND ${auditLog.entityId} = ${entityId}`)
      .orderBy(sql`${auditLog.createdAt} DESC`);
  }
}
