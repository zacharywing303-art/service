import type { FastifyInstance } from 'fastify';
import { ReportingService } from '@openfsm/core';
import { requireAuth } from '../middleware/require-auth.js';

export async function reportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/dashboard', async () => {
    return new ReportingService((app as any).db).getDashboard();
  });
}
