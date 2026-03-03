import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { cleanupTestDb, closeTestDb, getTestDb, seedTestUser } from '@openfsm/db/test-utils';
import { buildTestApp, createTestSession } from './test-app.js';

describe('Booking Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await closeTestDb();
  });

  beforeEach(async () => {
    await cleanupTestDb();
  });

  describe('GET /booking/availability (public)', () => {
    it('returns available time slots for a date', async () => {
      // This endpoint is public and does not require auth.
      // We need a technicianId and a date. Seed a user to act as technician.
      const db = getTestDb();
      const user = await seedTestUser(db);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const response = await app.inject({
        method: 'GET',
        url: `/booking/availability?technicianId=${user.id}&date=${dateStr}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toBeInstanceOf(Array);
      // With no existing events, should have 11 slots (7am-6pm, 1-hour each)
      expect(body.length).toBe(11);
      expect(body[0]).toHaveProperty('start');
      expect(body[0]).toHaveProperty('end');
    });
  });

  describe('POST /booking (public)', () => {
    it('creates a booking request without auth', async () => {
      const preferredDate = new Date();
      preferredDate.setDate(preferredDate.getDate() + 3);

      const response = await app.inject({
        method: 'POST',
        url: '/booking',
        payload: {
          customerName: 'Walk-In Customer',
          customerEmail: 'walkin@example.com',
          customerPhone: '555-0200',
          serviceRequested: 'AC Repair',
          preferredDate: preferredDate.toISOString(),
          preferredTimeSlot: '9:00 AM',
          description: 'Central AC unit is not cooling properly',
          address: '123 Main St, Anytown, CA 90210',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.id).toBeDefined();
      expect(body.customerName).toBe('Walk-In Customer');
      expect(body.customerEmail).toBe('walkin@example.com');
      expect(body.serviceRequested).toBe('AC Repair');
      expect(body.status).toBe('pending');
    });

    it('returns 400 for invalid booking (missing required fields)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/booking',
        payload: {
          customerName: 'Incomplete',
          // missing customerEmail, serviceRequested, preferredDate
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /booking/requests (admin, requires auth)', () => {
    it('returns 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/booking/requests',
      });

      expect(response.statusCode).toBe(401);
    });

    it('returns a paginated list of booking requests with auth', async () => {
      const db = getTestDb();
      const user = await seedTestUser(db);
      const sessionToken = await createTestSession(user.id);

      // Create a booking first
      const preferredDate = new Date();
      preferredDate.setDate(preferredDate.getDate() + 5);
      await app.inject({
        method: 'POST',
        url: '/booking',
        payload: {
          customerName: 'Listed Customer',
          customerEmail: 'listed@example.com',
          serviceRequested: 'Plumbing',
          preferredDate: preferredDate.toISOString(),
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/booking/requests',
        headers: { cookie: `session_token=${sessionToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /booking/:id/cancel (admin, requires auth)', () => {
    it('cancels a booking request', async () => {
      const db = getTestDb();
      const user = await seedTestUser(db);
      const sessionToken = await createTestSession(user.id);

      // Create a booking
      const preferredDate = new Date();
      preferredDate.setDate(preferredDate.getDate() + 7);
      const createRes = await app.inject({
        method: 'POST',
        url: '/booking',
        payload: {
          customerName: 'Cancellable Customer',
          customerEmail: 'cancel@example.com',
          serviceRequested: 'Electrical',
          preferredDate: preferredDate.toISOString(),
        },
      });
      const booking = createRes.json();

      const response = await app.inject({
        method: 'POST',
        url: `/booking/${booking.id}/cancel`,
        headers: { cookie: `session_token=${sessionToken}` },
        payload: { reason: 'Customer requested cancellation' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.status).toBe('cancelled');
      expect(body.cancelReason).toBe('Customer requested cancellation');
    });
  });
});
