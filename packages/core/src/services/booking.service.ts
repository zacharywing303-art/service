import { eq, sql, count } from 'drizzle-orm';
import { bookingRequests } from '@openfsm/db';
import type { Database } from '@openfsm/db';
import { NotFoundError, InvalidStateTransitionError } from '../errors/index.js';
import type { CreateBookingInput, PaginationParams, PaginatedResult } from '../types/index.js';
import { getOffset, paginate } from '../utils/pagination.js';

export class BookingService {
  constructor(private db: Database) {}

  async list(params: PaginationParams): Promise<PaginatedResult<typeof bookingRequests.$inferSelect>> {
    const [{ value: total }] = await this.db.select({ value: count() }).from(bookingRequests);
    const data = await this.db.select().from(bookingRequests)
      .limit(params.limit).offset(getOffset(params))
      .orderBy(sql`${bookingRequests.createdAt} DESC`);
    return paginate(data, total, params);
  }

  async getById(id: string) {
    const [booking] = await this.db.select().from(bookingRequests).where(eq(bookingRequests.id, id)).limit(1);
    if (!booking) throw new NotFoundError('BookingRequest', id);
    return booking;
  }

  async create(input: CreateBookingInput) {
    const [booking] = await this.db.insert(bookingRequests).values({
      ...input,
      preferredDate: new Date(input.preferredDate),
    }).returning();
    return booking;
  }

  async confirm(id: string, jobId: string, customerId: string) {
    const booking = await this.getById(id);
    if (booking.status !== 'pending') {
      throw new InvalidStateTransitionError('BookingRequest', booking.status, 'confirmed');
    }

    const [updated] = await this.db.update(bookingRequests).set({
      status: 'confirmed',
      confirmedAt: new Date(),
      jobId,
      customerId,
      updatedAt: new Date(),
    }).where(eq(bookingRequests.id, id)).returning();
    return updated;
  }

  async cancel(id: string, reason?: string) {
    const [updated] = await this.db.update(bookingRequests).set({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason,
      updatedAt: new Date(),
    }).where(eq(bookingRequests.id, id)).returning();
    if (!updated) throw new NotFoundError('BookingRequest', id);
    return updated;
  }
}
