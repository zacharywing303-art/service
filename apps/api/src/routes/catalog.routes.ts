import type { FastifyInstance } from 'fastify';
import { CatalogService, createCatalogItemSchema, paginationSchema } from '@openfsm/core';
import { requireAuth } from '../middleware/require-auth.js';

export async function catalogRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/items', async (request) => {
    const params = paginationSchema.parse(request.query);
    return new CatalogService((app as any).db).listItems(params);
  });

  app.get('/items/:id', async (request) => {
    const { id } = request.params as { id: string };
    return new CatalogService((app as any).db).getItemById(id);
  });

  app.post('/items', async (request, reply) => {
    const input = createCatalogItemSchema.parse(request.body);
    return reply.status(201).send(await new CatalogService((app as any).db).createItem(input));
  });

  app.put('/items/:id', async (request) => {
    const { id } = request.params as { id: string };
    const input = createCatalogItemSchema.partial().parse(request.body);
    return new CatalogService((app as any).db).updateItem(id, input);
  });

  app.get('/tax-rates', async () => {
    return new CatalogService((app as any).db).listTaxRates();
  });
}
