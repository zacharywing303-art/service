import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService, UnauthorizedError } from '@openfsm/core';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies?.session_token;
  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }

  const authService = new AuthService((request.server as any).db);
  const user = await authService.validateSession(token);
  (request as any).user = user;
}
