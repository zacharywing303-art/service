import 'dotenv/config';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { createDb } from '@openfsm/db';
import { authRoutes } from './routes/auth.routes.js';
import { customerRoutes } from './routes/customers.routes.js';
import { jobRoutes } from './routes/jobs.routes.js';
import { catalogRoutes } from './routes/catalog.routes.js';
import { estimateRoutes } from './routes/estimates.routes.js';
import { invoiceRoutes } from './routes/invoices.routes.js';
import { paymentRoutes } from './routes/payments.routes.js';
import { scheduleRoutes } from './routes/schedule.routes.js';
import { reportRoutes } from './routes/reports.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { siteRoutes } from './routes/site.routes.js';
import { bookingRoutes } from './routes/booking.routes.js';
import { portalRoutes } from './routes/portal.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { errorHandler } from './plugins/error-handler.js';

const port = parseInt(process.env.API_PORT || '4000');
const host = process.env.API_HOST || '0.0.0.0';

async function start() {
  const app = Fastify({ logger: true });
  const db = createDb();

  // Plugins
  await app.register(cors, {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
  });
  await app.register(cookie, { secret: process.env.SESSION_SECRET || 'dev-secret' });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  // Decorate with db
  app.decorate('db', db);

  // Error handler
  app.setErrorHandler(errorHandler);

  // Routes
  await app.register(healthRoutes, { prefix: '/healthz' });
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(customerRoutes, { prefix: '/customers' });
  await app.register(jobRoutes, { prefix: '/jobs' });
  await app.register(catalogRoutes, { prefix: '/catalog' });
  await app.register(estimateRoutes, { prefix: '/estimates' });
  await app.register(invoiceRoutes, { prefix: '/invoices' });
  await app.register(paymentRoutes, { prefix: '/payments' });
  await app.register(scheduleRoutes, { prefix: '/schedule' });
  await app.register(reportRoutes, { prefix: '/reports' });
  await app.register(settingsRoutes, { prefix: '/settings' });
  await app.register(siteRoutes, { prefix: '/site' });
  await app.register(bookingRoutes, { prefix: '/booking' });
  await app.register(portalRoutes, { prefix: '/portal' });

  await app.listen({ port, host });
  console.log(`OpenFSM API running on http://${host}:${port}`);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { start };
