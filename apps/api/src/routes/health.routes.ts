import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  app.get('/ready', async (_request, reply) => {
    try {
      const db = (app as any).db;
      await db.execute(sql`SELECT 1`);
      return { status: 'ready', database: 'connected' };
    } catch {
      return reply.status(503).send({ status: 'not ready', database: 'disconnected' });
    }
  });
}
