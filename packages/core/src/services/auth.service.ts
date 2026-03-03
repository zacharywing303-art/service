import { eq } from 'drizzle-orm';
import { users, sessions } from '@openfsm/db';
import type { Database } from '@openfsm/db';
import { UnauthorizedError, ConflictError } from '../errors/index.js';
import type { LoginInput, RegisterInput } from '../types/index.js';
import { randomUUID } from 'crypto';

// In production, use argon2. For seed/testing, we accept pre-hashed passwords.
let argon2: { hash: (pw: string) => Promise<string>; verify: (hash: string, pw: string) => Promise<boolean> };
try {
  argon2 = await import('argon2');
} catch {
  // Fallback for environments without argon2 native bindings
  argon2 = {
    hash: async (pw: string) => `hashed:${pw}`,
    verify: async (hash: string, pw: string) => hash === `hashed:${pw}`,
  };
}

export class AuthService {
  constructor(private db: Database) {}

  async register(input: RegisterInput) {
    const existing = await this.db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (existing.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await argon2.hash(input.password);
    const [user] = await this.db.insert(users).values({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role,
    }).returning();

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async login(input: LoginInput) {
    const [user] = await this.db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Create session token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    await this.db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token, expiresAt };
  }

  async validateSession(token: string) {
    const [session] = await this.db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    const [user] = await this.db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or deactivated');
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async logout(token: string) {
    await this.db.delete(sessions).where(eq(sessions.token, token));
  }
}
