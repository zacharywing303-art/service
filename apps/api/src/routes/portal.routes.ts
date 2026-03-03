import type { FastifyInstance } from 'fastify';
import { PortalService, CustomerService, MessageService, JobService, EstimateService, InvoiceService } from '@openfsm/core';
import { requireCustomerAuth } from '../middleware/require-customer-auth.js';
import { createHmac } from 'crypto';

function createPortalToken(customerId: string): string {
  const secret = process.env.PORTAL_JWT_SECRET || 'dev-portal-jwt-secret';
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    customerId,
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
  })).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export async function portalRoutes(app: FastifyInstance) {
  app.post('/auth/magic-link', async (request) => {
    const { email } = request.body as { email: string };
    return new PortalService((app as any).db).requestMagicLink(email);
  });

  app.post('/auth/verify', async (request) => {
    const { token } = request.body as { token: string };
    const result = await new PortalService((app as any).db).validateMagicLink(token);
    return { token: createPortalToken(result.customerId), customer: result.customer };
  });

  app.get('/dashboard', { preHandler: [requireCustomerAuth] }, async (request) => {
    const customerId = (request as any).customerId;
    const db = (app as any).db;
    const [jobResult, estimateResult, invoiceResult, unreadMessages] = await Promise.all([
      new JobService(db).list({ page: 1, limit: 5, sortOrder: 'desc' }),
      new EstimateService(db).list({ page: 1, limit: 5, sortOrder: 'desc' }),
      new InvoiceService(db).list({ page: 1, limit: 5, sortOrder: 'desc' }),
      new MessageService(db).getUnreadCount(customerId),
    ]);
    return { recentJobs: jobResult.data, recentEstimates: estimateResult.data, recentInvoices: invoiceResult.data, unreadMessages };
  });

  app.get('/messages', { preHandler: [requireCustomerAuth] }, async (request) => {
    return new MessageService((app as any).db).getByCustomer((request as any).customerId);
  });

  app.post('/messages', { preHandler: [requireCustomerAuth] }, async (request, reply) => {
    const { content } = request.body as { content: string };
    return reply.status(201).send(
      await new MessageService((app as any).db).send({ customerId: (request as any).customerId, content, isFromCustomer: true }),
    );
  });

  app.get('/profile', { preHandler: [requireCustomerAuth] }, async (request) => {
    const customerId = (request as any).customerId;
    const service = new CustomerService((app as any).db);
    const customer = await service.getById(customerId);
    const locations = await service.getLocations(customerId);
    return { ...customer, locations };
  });

  app.put('/profile', { preHandler: [requireCustomerAuth] }, async (request) => {
    return new CustomerService((app as any).db).update((request as any).customerId, request.body as any);
  });
}
