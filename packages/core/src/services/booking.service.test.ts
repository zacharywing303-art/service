import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanupTestDb, closeTestDb, seedTestCustomer } from '@openfsm/db/test-utils';
import { jobs } from '@openfsm/db';
import { BookingService } from './booking.service.js';
import { InvalidStateTransitionError, NotFoundError } from '../errors/index.js';

describe('BookingService', () => {
  const db = getTestDb();
  const service = new BookingService(db as any);

  beforeEach(async () => {
    await cleanupTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  const makeBookingInput = (overrides = {}) => ({
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    customerPhone: '555-1234',
    serviceRequested: 'AC Repair',
    preferredDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    description: 'AC unit not cooling',
    address: '123 Main St',
    ...overrides,
  });

  describe('create', () => {
    it('creates a booking request with pending status', async () => {
      const booking = await service.create(makeBookingInput());

      expect(booking).toBeDefined();
      expect(booking.id).toBeDefined();
      expect(booking.customerName).toBe('Jane Smith');
      expect(booking.customerEmail).toBe('jane@example.com');
      expect(booking.serviceRequested).toBe('AC Repair');
      expect(booking.status).toBe('pending');
    });

    it('stores the preferred date', async () => {
      const input = makeBookingInput();
      const booking = await service.create(input);

      expect(booking.preferredDate).toBeDefined();
    });
  });

  describe('list', () => {
    it('returns paginated booking requests', async () => {
      await service.create(makeBookingInput());
      await service.create(makeBookingInput({ customerName: 'Bob Jones' }));

      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('returns empty list when no bookings exist', async () => {
      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' });
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('returns a booking by id', async () => {
      const created = await service.create(makeBookingInput());
      const found = await service.getById(created.id);

      expect(found.id).toBe(created.id);
    });

    it('throws NotFoundError for a nonexistent id', async () => {
      await expect(
        service.getById('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('confirm', () => {
    it('confirms a pending booking', async () => {
      const customer = await seedTestCustomer(db);
      const booking = await service.create(makeBookingInput());

      // Create a job to link to
      const [job] = await (db as any).insert(jobs).values({
        customerId: customer.id,
        title: 'AC Repair Job',
        number: 1001,
      }).returning();

      const confirmed = await service.confirm(booking.id, job.id, customer.id);

      expect(confirmed.status).toBe('confirmed');
      expect(confirmed.confirmedAt).toBeDefined();
      expect(confirmed.jobId).toBe(job.id);
      expect(confirmed.customerId).toBe(customer.id);
    });

    it('throws InvalidStateTransitionError when confirming a non-pending booking', async () => {
      const customer = await seedTestCustomer(db);
      const booking = await service.create(makeBookingInput());
      await service.cancel(booking.id);

      await expect(
        service.confirm(booking.id, 'some-job-id', customer.id),
      ).rejects.toThrow(InvalidStateTransitionError);
    });
  });

  describe('cancel', () => {
    it('cancels a booking request', async () => {
      const booking = await service.create(makeBookingInput());
      const cancelled = await service.cancel(booking.id, 'Customer changed mind');

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.cancelledAt).toBeDefined();
      expect(cancelled.cancelReason).toBe('Customer changed mind');
    });

    it('cancels a booking without a reason', async () => {
      const booking = await service.create(makeBookingInput());
      const cancelled = await service.cancel(booking.id);

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.cancelReason).toBeNull();
    });

    it('throws NotFoundError for a nonexistent booking', async () => {
      await expect(
        service.cancel('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
