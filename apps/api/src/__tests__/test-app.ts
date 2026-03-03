import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { getTestDb } from '@openfsm/db/test-utils';
import { sessions, users } from '@openfsm/db';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { errorHandler } from '../plugins/error-handler.js';

export async function buildTestApp() {
  const app = Fastify({ logger: false });
  const db = getTestDb();

  await app.register(cookie, { secret: 'test-secret' });
  app.decorate('db', db);

  // Error handler so AppError / ZodError get proper status codes
  app.setErrorHandler(errorHandler);

  // Register routes
  const { healthRoutes } = await import('../routes/health.routes.js');
  const { authRoutes } = await import('../routes/auth.routes.js');
  const { customerRoutes } = await import('../routes/customers.routes.js');
  const { jobRoutes } = await import('../routes/jobs.routes.js');
  const { catalogRoutes } = await import('../routes/catalog.routes.js');
  const { estimateRoutes } = await import('../routes/estimates.routes.js');
  const { invoiceRoutes } = await import('../routes/invoices.routes.js');
  const { paymentRoutes } = await import('../routes/payments.routes.js');
  const { bookingRoutes } = await import('../routes/booking.routes.js');
  const { portalRoutes } = await import('../routes/portal.routes.js');

  await app.register(healthRoutes, { prefix: '/healthz' });
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(customerRoutes, { prefix: '/customers' });
  await app.register(jobRoutes, { prefix: '/jobs' });
  await app.register(catalogRoutes, { prefix: '/catalog' });
  await app.register(estimateRoutes, { prefix: '/estimates' });
  await app.register(invoiceRoutes, { prefix: '/invoices' });
  await app.register(paymentRoutes, { prefix: '/payments' });
  await app.register(bookingRoutes, { prefix: '/booking' });
  await app.register(portalRoutes, { prefix: '/portal' });

  await app.ready();
  return app;
}

/**
 * Create a session token directly in the DB for a given user.
 * Returns the raw token string to pass as session_token cookie.
 */
export async function createTestSession(userId: string): Promise<string> {
  const db = getTestDb();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });

  return token;
}
