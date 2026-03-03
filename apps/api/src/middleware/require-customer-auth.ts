import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '@openfsm/core';
import { createHmac } from 'crypto';

export async function requireCustomerAuth(request: FastifyRequest, _reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Portal authentication required');
  }

  const token = authHeader.slice(7);
  const secret = process.env.PORTAL_JWT_SECRET || 'dev-portal-jwt-secret';

  try {
    const [headerB64, payloadB64, signature] = token.split('.');
    const expectedSig = createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    if (signature !== expectedSig) throw new UnauthorizedError('Invalid portal token');

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new UnauthorizedError('Portal token expired');
    }

    (request as any).customerId = payload.customerId;
  } catch (e) {
    if (e instanceof UnauthorizedError) throw e;
    throw new UnauthorizedError('Invalid portal token');
  }
}
