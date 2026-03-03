import type { FastifyInstance } from 'fastify';
import { PaymentService, recordPaymentSchema, paginationSchema } from '@openfsm/core';
import { requireAuth } from '../middleware/require-auth.js';

export async function paymentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => {
    const params = paginationSchema.parse(request.query);
    return new PaymentService((app as any).db).list(params);
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return new PaymentService((app as any).db).getById(id);
  });

  app.post('/', async (request, reply) => {
    const input = recordPaymentSchema.parse(request.body);
    return reply.status(201).send(await new PaymentService((app as any).db).record(input));
  });
}
