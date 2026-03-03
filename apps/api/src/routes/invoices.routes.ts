import type { FastifyInstance } from 'fastify';
import { InvoiceService, PaymentService, createInvoiceSchema, paginationSchema } from '@openfsm/core';
import { requireAuth } from '../middleware/require-auth.js';

export async function invoiceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => {
    const params = paginationSchema.parse(request.query);
    const { status } = request.query as any;
    return new InvoiceService((app as any).db).list(params, { status });
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const service = new InvoiceService((app as any).db);
    const invoice = await service.getById(id);
    const lineItems = await service.getLineItems(id);
    return { ...invoice, lineItems };
  });

  app.post('/', async (request, reply) => {
    const input = createInvoiceSchema.parse(request.body);
    return reply.status(201).send(await new InvoiceService((app as any).db).create(input));
  });

  app.post('/from-estimate/:estimateId', async (request, reply) => {
    const { estimateId } = request.params as { estimateId: string };
    return reply.status(201).send(await new InvoiceService((app as any).db).createFromEstimate(estimateId));
  });

  app.post('/:id/send', async (request) => {
    const { id } = request.params as { id: string };
    return new InvoiceService((app as any).db).updateStatus(id, 'sent');
  });

  app.post('/:id/void', async (request) => {
    const { id } = request.params as { id: string };
    return new InvoiceService((app as any).db).updateStatus(id, 'void');
  });

  app.get('/:id/payments', async (request) => {
    const { id } = request.params as { id: string };
    return new PaymentService((app as any).db).getByInvoice(id);
  });
}
