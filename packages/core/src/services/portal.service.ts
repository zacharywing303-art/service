import { eq } from 'drizzle-orm';
import { customerAuth, magicLinks, customers } from '@openfsm/db';
import type { Database } from '@openfsm/db';
import { NotFoundError, UnauthorizedError } from '../errors/index.js';
import { randomUUID } from 'crypto';

export class PortalService {
  constructor(private db: Database) {}

  async requestMagicLink(email: string) {
    const [auth] = await this.db.select().from(customerAuth).where(eq(customerAuth.email, email)).limit(1);
    if (!auth) {
      // Don't reveal if email exists or not
      return { sent: true };
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.db.insert(magicLinks).values({
      customerAuthId: auth.id,
      token,
      expiresAt,
    });

    // In production, queue email send job here
    return { sent: true, token }; // token returned for dev/testing only
  }

  async validateMagicLink(token: string) {
    const [link] = await this.db.select().from(magicLinks).where(eq(magicLinks.token, token)).limit(1);
    if (!link || link.expiresAt < new Date() || link.usedAt) {
      throw new UnauthorizedError('Invalid or expired magic link');
    }

    // Mark as used
    await this.db.update(magicLinks).set({ usedAt: new Date() }).where(eq(magicLinks.id, link.id));

    // Get customer auth and customer
    const [auth] = await this.db.select().from(customerAuth).where(eq(customerAuth.id, link.customerAuthId)).limit(1);
    if (!auth) throw new UnauthorizedError('Customer not found');

    const [customer] = await this.db.select().from(customers).where(eq(customers.id, auth.customerId)).limit(1);
    if (!customer) throw new UnauthorizedError('Customer not found');

    // Update last login
    await this.db.update(customerAuth).set({ lastLoginAt: new Date() }).where(eq(customerAuth.id, auth.id));

    return { customer, customerId: auth.customerId };
  }
}
