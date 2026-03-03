import { eq } from 'drizzle-orm';
import { siteConfig, companySettings, catalogItems } from '@openfsm/db';
import type { Database } from '@openfsm/db';

export class SiteService {
  constructor(private db: Database) {}

  async getConfig() {
    const [site] = await this.db.select().from(siteConfig).limit(1);
    const [company] = await this.db.select().from(companySettings).limit(1);
    const services = await this.db.select().from(catalogItems)
      .where(eq(catalogItems.isActive, true));

    return {
      site,
      company: company ? {
        name: company.companyName,
        tagline: company.tagline,
        phone: company.phone,
        email: company.email,
        address: [company.address1, company.address2, company.city, company.state, company.zip].filter(Boolean).join(', '),
      } : null,
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: s.unitPrice,
        type: s.type,
      })),
    };
  }

  async updateConfig(input: Partial<typeof siteConfig.$inferInsert>) {
    const [existing] = await this.db.select().from(siteConfig).limit(1);
    if (existing) {
      const [updated] = await this.db.update(siteConfig)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(siteConfig.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await this.db.insert(siteConfig).values(input).returning();
    return created;
  }
}
