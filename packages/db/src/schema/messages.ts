import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { customers } from './customers.js';
import { users } from './users.js';

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  staffUserId: uuid('staff_user_id').references(() => users.id),
  isFromCustomer: boolean('is_from_customer').notNull().default(true),
  content: text('content').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('messages_customer_idx').on(t.customerId),
  index('messages_created_idx').on(t.createdAt),
]);
