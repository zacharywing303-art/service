import type { FastifyInstance } from 'fastify';
import { SchedulingService } from '@openfsm/core';
import { requireAuth } from '../middleware/require-auth.js';

export async function scheduleRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => {
    const { start, end, technicianId } = request.query as any;
    return new SchedulingService((app as any).db).getEvents(new Date(start), new Date(end), technicianId);
  });

  app.post('/', async (request, reply) => {
    const body = request.body as any;
    const event = await new SchedulingService((app as any).db).createEvent({
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    });
    return reply.status(201).send(event);
  });

  app.put('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const updates: any = {};
    if (body.startTime) updates.startTime = new Date(body.startTime);
    if (body.endTime) updates.endTime = new Date(body.endTime);
    if (body.title) updates.title = body.title;
    return new SchedulingService((app as any).db).updateEvent(id, updates);
  });

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return new SchedulingService((app as any).db).deleteEvent(id);
  });
}
