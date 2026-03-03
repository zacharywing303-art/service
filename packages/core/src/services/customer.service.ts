import { eq, ilike, or, isNull, sql, and, count } from 'drizzle-orm';
import { customers, locations, notes } from '@openfsm/db';
import type { Database } from '@openfsm/db';
import { NotFoundError } from '../errors/index.js';
import type { CreateCustomerInput, PaginationParams, PaginatedResult } from '../types/index.js';
import { getOffset, paginate } from '../utils/pagination.js';

export class CustomerService {
  constructor(private db: Database) {}

  async list(params: PaginationParams, search?: string): Promise<PaginatedResult<typeof customers.$inferSelect>> {
    const conditions = [isNull(customers.deletedAt)];
    if (search) {
      conditions.push(
        or(
          ilike(customers.firstName, `%${search}%`),
          ilike(customers.lastName, `%${search}%`),
          ilike(customers.email, `%${search}%`),
          ilike(customers.companyName, `%${search}%`),
        )!,
      );
    }

    const where = and(...conditions);
    const [{ value: total }] = await this.db.select({ value: count() }).from(customers).where(where);
    const data = await this.db.select().from(customers).where(where)
      .limit(params.limit)
      .offset(getOffset(params))
      .orderBy(sql`${customers.createdAt} DESC`);

    return paginate(data, total, params);
  }

  async getById(id: string) {
    const [customer] = await this.db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (!customer) throw new NotFoundError('Customer', id);
    return customer;
  }

  async create(input: CreateCustomerInput) {
    const [customer] = await this.db.insert(customers).values(input).returning();
    return customer;
  }

  async update(id: string, input: Partial<CreateCustomerInput>) {
    const [customer] = await this.db.update(customers)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    if (!customer) throw new NotFoundError('Customer', id);
    return customer;
  }

  async delete(id: string) {
    const [customer] = await this.db.update(customers)
      .set({ deletedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    if (!customer) throw new NotFoundError('Customer', id);
    return customer;
  }

  async getLocations(customerId: string) {
    return this.db.select().from(locations).where(eq(locations.customerId, customerId));
  }

  async addLocation(input: { customerId: string; name?: string; address1: string; address2?: string; city: string; state: string; zip: string; notes?: string }) {
    const [location] = await this.db.insert(locations).values(input).returning();
    return location;
  }

  async getNotes(customerId: string) {
    return this.db.select().from(notes).where(eq(notes.customerId, customerId))
      .orderBy(sql`${notes.createdAt} DESC`);
  }

  async addNote(customerId: string, authorId: string, content: string) {
    const [note] = await this.db.insert(notes).values({ customerId, authorId, content }).returning();
    return note;
  }
}
