import type { FastifyInstance } from 'fastify';
import { EstimateService, createEstimateSchema, paginationSchema } from '@openfsm/core';
import { requireAuth } from '../middleware/require-auth.js';

export async function estimateRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => {
    const params = paginationSchema.parse(request.query);
    return new EstimateService((app as any).db).list(params);
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const service = new EstimateService((app as any).db);
    const estimate = await service.getById(id);
    const lineItems = await service.getLineItems(id);
    return { ...estimate, lineItems };
  });

  app.post('/', async (request, reply) => {
    const input = createEstimateSchema.parse(request.body);
    return reply.status(201).send(await new EstimateService((app as any).db).create(input));
  });

  app.post('/:id/send', async (request) => {
    const { id } = request.params as { id: string };
    return new EstimateService((app as any).db).updateStatus(id, 'sent');
  });

  app.post('/:id/accept', async (request) => {
    const { id } = request.params as { id: string };
    const { signatureData } = (request.body as any) || {};
    return new EstimateService((app as any).db).accept(id, signatureData);
  });

  app.post('/:id/decline', async (request) => {
    const { id } = request.params as { id: string };
    return new EstimateService((app as any).db).updateStatus(id, 'declined');
  });
}
