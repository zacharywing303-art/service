import { eq } from 'drizzle-orm';
import { companySettings } from '@openfsm/db';
import type { Database } from '@openfsm/db';
import { NotFoundError } from '../errors/index.js';

export class SettingsService {
  constructor(private db: Database) {}

  async get() {
    const [settings] = await this.db.select().from(companySettings).limit(1);
    if (!settings) throw new NotFoundError('CompanySettings');
    return settings;
  }

  async update(input: Partial<typeof companySettings.$inferInsert>) {
    const [existing] = await this.db.select().from(companySettings).limit(1);
    if (!existing) {
      const [created] = await this.db.insert(companySettings).values(input as any).returning();
      return created;
    }
    const [updated] = await this.db.update(companySettings)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(companySettings.id, existing.id))
      .returning();
    return updated;
  }
}
