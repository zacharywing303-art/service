import type { FastifyInstance } from 'fastify';
import { SettingsService, updateSettingsSchema } from '@openfsm/core';
import { requireAuth } from '../middleware/require-auth.js';
import { requireRole } from '../middleware/require-role.js';

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async () => {
    return new SettingsService((app as any).db).get();
  });

  app.put('/', { preHandler: [requireRole('owner', 'admin')] }, async (request) => {
    const input = updateSettingsSchema.parse(request.body);
    return new SettingsService((app as any).db).update(input);
  });
}
