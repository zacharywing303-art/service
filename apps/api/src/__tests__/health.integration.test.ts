import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { cleanupTestDb, closeTestDb } from '@openfsm/db/test-utils';
import { buildTestApp } from './test-app.js';

describe('Health Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await cleanupTestDb();
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await closeTestDb();
  });

  it('GET /healthz returns status ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  it('GET /healthz/ready returns database connected', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/healthz/ready',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('ready');
    expect(body.database).toBe('connected');
  });
});
