import { pgTable, uuid, varchar, text, timestamp, numeric, pgEnum, index } from 'drizzle-orm/pg-core';
import { invoices } from './invoices.js';
import { customers } from './customers.js';

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash', 'check', 'credit_card', 'bank_transfer', 'zelle', 'stripe', 'other',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'completed', 'refunded', 'failed',
]);

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  status: paymentStatusEnum('status').notNull().default('completed'),
  reference: varchar('reference', { length: 255 }),
  notes: text('notes'),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).unique(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('payments_invoice_idx').on(t.invoiceId),
  index('payments_customer_idx').on(t.customerId),
]);
