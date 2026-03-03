import { eq, sql, and } from 'drizzle-orm';
import { messages } from '@openfsm/db';
import type { Database } from '@openfsm/db';
import type { SendMessageInput } from '../types/index.js';

export class MessageService {
  constructor(private db: Database) {}

  async getByCustomer(customerId: string) {
    return this.db.select().from(messages)
      .where(eq(messages.customerId, customerId))
      .orderBy(sql`${messages.createdAt} ASC`);
  }

  async send(input: SendMessageInput & { staffUserId?: string }) {
    const [message] = await this.db.insert(messages).values({
      customerId: input.customerId,
      content: input.content,
      isFromCustomer: input.isFromCustomer,
      staffUserId: input.staffUserId,
    }).returning();
    return message;
  }

  async markRead(messageId: string) {
    const [message] = await this.db.update(messages)
      .set({ readAt: new Date() })
      .where(eq(messages.id, messageId))
      .returning();
    return message;
  }

  async getUnreadCount(customerId?: string) {
    const conditions = [eq(messages.isFromCustomer, true)];
    if (customerId) {
      conditions.push(eq(messages.customerId, customerId));
    }
    const result = await this.db.select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(and(...conditions, sql`${messages.readAt} IS NULL`));
    return result[0]?.count ?? 0;
  }
}
