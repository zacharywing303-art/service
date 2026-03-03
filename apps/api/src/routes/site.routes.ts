import type { FastifyInstance } from 'fastify';
import { SiteService } from '@openfsm/core';

export async function siteRoutes(app: FastifyInstance) {
  app.get('/config', async () => {
    return new SiteService((app as any).db).getConfig();
  });
}
