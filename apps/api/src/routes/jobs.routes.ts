import type { FastifyInstance } from 'fastify';
import { JobService, createJobSchema, updateJobStatusSchema, paginationSchema } from '@openfsm/core';
import { requireAuth } from '../middleware/require-auth.js';

export async function jobRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => {
    const params = paginationSchema.parse(request.query);
    const { status, technicianId } = request.query as any;
    return new JobService((app as any).db).list(params, { status, technicianId });
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return new JobService((app as any).db).getById(id);
  });

  app.post('/', async (request, reply) => {
    const input = createJobSchema.parse(request.body);
    return reply.status(201).send(await new JobService((app as any).db).create(input));
  });

  app.patch('/:id/status', async (request) => {
    const { id } = request.params as { id: string };
    const { status } = updateJobStatusSchema.parse(request.body);
    return new JobService((app as any).db).updateStatus(id, status);
  });

  app.post('/:id/assignments', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { technicianId } = request.body as { technicianId: string };
    return reply.status(201).send(await new JobService((app as any).db).assignTechnician(id, technicianId));
  });

  app.get('/:id/assignments', async (request) => {
    const { id } = request.params as { id: string };
    return new JobService((app as any).db).getAssignments(id);
  });

  app.post('/:id/timer/start', async (request, reply) => {
    const { id } = request.params as { id: string };
    const technicianId = (request as any).user.id;
    return reply.status(201).send(await new JobService((app as any).db).startTimer(id, technicianId));
  });

  app.post('/timer/:entryId/stop', async (request) => {
    const { entryId } = request.params as { entryId: string };
    return new JobService((app as any).db).stopTimer(entryId);
  });

  app.post('/:id/materials', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.status(201).send(await new JobService((app as any).db).addMaterial(id, request.body as any));
  });
}
