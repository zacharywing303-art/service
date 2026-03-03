import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { cleanupTestDb, closeTestDb, getTestDb, seedTestUser } from '@openfsm/db/test-utils';
import { buildTestApp, createTestSession } from './test-app.js';

describe('Customer Routes', () => {
  let app: FastifyInstance;
  let sessionToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await closeTestDb();
  });

  beforeEach(async () => {
    await cleanupTestDb();
    const db = getTestDb();
    const user = await seedTestUser(db);
    userId = user.id;
    sessionToken = await createTestSession(userId);
  });

  describe('authentication', () => {
    it('returns 401 when no session cookie is provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/customers',
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /customers', () => {
    it('creates a new customer', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/customers',
        headers: {
          cookie: `session_token=${sessionToken}`,
        },
        payload: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '555-0123',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.id).toBeDefined();
      expect(body.firstName).toBe('Jane');
      expect(body.lastName).toBe('Smith');
      expect(body.email).toBe('jane@example.com');
      expect(body.phone).toBe('555-0123');
    });

    it('returns 400 for invalid input (missing required fields)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/customers',
        headers: {
          cookie: `session_token=${sessionToken}`,
        },
        payload: {
          email: 'incomplete@example.com',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /customers', () => {
    it('returns a paginated list of customers', async () => {
      // Seed a customer first
      await app.inject({
        method: 'POST',
        url: '/customers',
        headers: { cookie: `session_token=${sessionToken}` },
        payload: { firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com' },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/customers',
        headers: { cookie: `session_token=${sessionToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.total).toBeGreaterThanOrEqual(1);
      expect(body.page).toBe(1);
      expect(body.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('supports search query parameter', async () => {
      await app.inject({
        method: 'POST',
        url: '/customers',
        headers: { cookie: `session_token=${sessionToken}` },
        payload: { firstName: 'Unique', lastName: 'Searchable' },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/customers?search=Unique',
        headers: { cookie: `session_token=${sessionToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.length).toBe(1);
      expect(body.data[0].firstName).toBe('Unique');
    });
  });

  describe('GET /customers/:id', () => {
    it('returns a customer by id', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/customers',
        headers: { cookie: `session_token=${sessionToken}` },
        payload: { firstName: 'Bob', lastName: 'Williams' },
      });
      const created = createRes.json();

      const response = await app.inject({
        method: 'GET',
        url: `/customers/${created.id}`,
        headers: { cookie: `session_token=${sessionToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe(created.id);
      expect(body.firstName).toBe('Bob');
    });

    it('returns 404 for a non-existent customer', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/customers/00000000-0000-0000-0000-000000000099',
        headers: { cookie: `session_token=${sessionToken}` },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('NOT_FOUND');
    });
  });

  describe('PUT /customers/:id', () => {
    it('updates a customer', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/customers',
        headers: { cookie: `session_token=${sessionToken}` },
        payload: { firstName: 'Carol', lastName: 'Davis' },
      });
      const created = createRes.json();

      const response = await app.inject({
        method: 'PUT',
        url: `/customers/${created.id}`,
        headers: { cookie: `session_token=${sessionToken}` },
        payload: { firstName: 'Caroline', phone: '555-9999' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe(created.id);
      expect(body.firstName).toBe('Caroline');
      expect(body.phone).toBe('555-9999');
      // lastName should remain unchanged
      expect(body.lastName).toBe('Davis');
    });
  });

  describe('DELETE /customers/:id', () => {
    it('soft-deletes a customer', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/customers',
        headers: { cookie: `session_token=${sessionToken}` },
        payload: { firstName: 'Deletable', lastName: 'Customer' },
      });
      const created = createRes.json();

      const response = await app.inject({
        method: 'DELETE',
        url: `/customers/${created.id}`,
        headers: { cookie: `session_token=${sessionToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.deletedAt).toBeDefined();

      // Deleted customer should not appear in list
      const listRes = await app.inject({
        method: 'GET',
        url: '/customers',
        headers: { cookie: `session_token=${sessionToken}` },
      });
      const listBody = listRes.json();
      const found = listBody.data.find((c: any) => c.id === created.id);
      expect(found).toBeUndefined();
    });
  });
});
