import { eq, sql, count } from 'drizzle-orm';
import { catalogItems, taxRates } from '@openfsm/db';
import type { Database } from '@openfsm/db';
import { NotFoundError } from '../errors/index.js';
import type { CreateCatalogItemInput, PaginationParams, PaginatedResult } from '../types/index.js';
import { getOffset, paginate } from '../utils/pagination.js';

export class CatalogService {
  constructor(private db: Database) {}

  async listItems(params: PaginationParams): Promise<PaginatedResult<typeof catalogItems.$inferSelect>> {
    const [{ value: total }] = await this.db.select({ value: count() }).from(catalogItems);
    const data = await this.db.select().from(catalogItems)
      .limit(params.limit).offset(getOffset(params))
      .orderBy(sql`${catalogItems.name} ASC`);
    return paginate(data, total, params);
  }

  async getItemById(id: string) {
    const [item] = await this.db.select().from(catalogItems).where(eq(catalogItems.id, id)).limit(1);
    if (!item) throw new NotFoundError('CatalogItem', id);
    return item;
  }

  async createItem(input: CreateCatalogItemInput) {
    const [item] = await this.db.insert(catalogItems).values(input).returning();
    return item;
  }

  async updateItem(id: string, input: Partial<CreateCatalogItemInput>) {
    const [item] = await this.db.update(catalogItems)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(catalogItems.id, id))
      .returning();
    if (!item) throw new NotFoundError('CatalogItem', id);
    return item;
  }

  async listTaxRates() {
    return this.db.select().from(taxRates).orderBy(sql`${taxRates.name} ASC`);
  }

  async getDefaultTaxRate() {
    const [rate] = await this.db.select().from(taxRates).where(eq(taxRates.isDefault, true)).limit(1);
    return rate;
  }
}
