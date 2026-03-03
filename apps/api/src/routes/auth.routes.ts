import type { FastifyInstance } from 'fastify';
import { AuthService, loginSchema, registerSchema } from '@openfsm/core';
import { requireAuth } from '../middleware/require-auth.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const authService = new AuthService((app as any).db);
    const user = await authService.register(input);
    return reply.status(201).send(user);
  });

  app.post('/login', async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const authService = new AuthService((app as any).db);
    const result = await authService.login(input);

    reply.setCookie('session_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: result.expiresAt,
    });

    return { user: result.user };
  });

  app.post('/logout', { preHandler: [requireAuth] }, async (request, reply) => {
    const token = request.cookies?.session_token;
    if (token) {
      const authService = new AuthService((app as any).db);
      await authService.logout(token);
      reply.clearCookie('session_token');
    }
    return { ok: true };
  });

  app.get('/me', { preHandler: [requireAuth] }, async (request) => {
    return (request as any).user;
  });
}
