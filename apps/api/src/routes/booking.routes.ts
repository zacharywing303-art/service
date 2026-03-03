import type { FastifyInstance } from 'fastify';
import { BookingService, SchedulingService, createBookingSchema, paginationSchema } from '@openfsm/core';
import { requireAuth } from '../middleware/require-auth.js';

export async function bookingRoutes(app: FastifyInstance) {
  // Public
  app.get('/availability', async (request) => {
    const { date, technicianId } = request.query as any;
    return new SchedulingService((app as any).db).getAvailableSlots(technicianId, new Date(date));
  });

  app.post('/', async (request, reply) => {
    const input = createBookingSchema.parse(request.body);
    return reply.status(201).send(await new BookingService((app as any).db).create(input));
  });

  // Admin
  app.get('/requests', { preHandler: [requireAuth] }, async (request) => {
    const params = paginationSchema.parse(request.query);
    return new BookingService((app as any).db).list(params);
  });

  app.post('/:id/confirm', { preHandler: [requireAuth] }, async (request) => {
    const { id } = request.params as { id: string };
    const { jobId, customerId } = request.body as { jobId: string; customerId: string };
    return new BookingService((app as any).db).confirm(id, jobId, customerId);
  });

  app.post('/:id/cancel', { preHandler: [requireAuth] }, async (request) => {
    const { id } = request.params as { id: string };
    const { reason } = (request.body as any) || {};
    return new BookingService((app as any).db).cancel(id, reason);
  });
}
