import type { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError } from '@openfsm/core';

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user) throw new ForbiddenError('Authentication required');
    if (!roles.includes(user.role)) {
      throw new ForbiddenError(`Requires role: ${roles.join(' or ')}`);
    }
  };
}
