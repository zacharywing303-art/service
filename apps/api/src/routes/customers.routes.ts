import type { FastifyInstance } from 'fastify';
import { CustomerService, createCustomerSchema, updateCustomerSchema, paginationSchema, createLocationSchema } from '@openfsm/core';
import { requireAuth } from '../middleware/require-auth.js';

export async function customerRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => {
    const params = paginationSchema.parse(request.query);
    const search = (request.query as any).search;
    const service = new CustomerService((app as any).db);
    return service.list(params, search);
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const service = new CustomerService((app as any).db);
    return service.getById(id);
  });

  app.post('/', async (request, reply) => {
    const input = createCustomerSchema.parse(request.body);
    const service = new CustomerService((app as any).db);
    return reply.status(201).send(await service.create(input));
  });

  app.put('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const input = updateCustomerSchema.parse(request.body);
    const service = new CustomerService((app as any).db);
    return service.update(id, input);
  });

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const service = new CustomerService((app as any).db);
    return service.delete(id);
  });

  app.get('/:id/locations', async (request) => {
    const { id } = request.params as { id: string };
    return new CustomerService((app as any).db).getLocations(id);
  });

  app.post('/:id/locations', async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = createLocationSchema.parse({ ...(request.body as any), customerId: id });
    return reply.status(201).send(await new CustomerService((app as any).db).addLocation(input));
  });

  app.get('/:id/notes', async (request) => {
    const { id } = request.params as { id: string };
    return new CustomerService((app as any).db).getNotes(id);
  });

  app.post('/:id/notes', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { content } = request.body as { content: string };
    const userId = (request as any).user.id;
    return reply.status(201).send(await new CustomerService((app as any).db).addNote(id, userId, content));
  });
}
