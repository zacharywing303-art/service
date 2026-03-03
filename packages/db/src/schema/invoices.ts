import { pgTable, uuid, varchar, text, timestamp, numeric, integer, pgEnum, index } from 'drizzle-orm/pg-core';
import { customers } from './customers.js';
import { locations } from './customers.js';
import { jobs } from './jobs.js';
import { estimates } from './estimates.js';
import { taxRates } from './catalog.js';

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft', 'sent', 'paid', 'partial', 'overdue', 'void',
]);

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  locationId: uuid('location_id').references(() => locations.id),
  jobId: uuid('job_id').references(() => jobs.id),
  estimateId: uuid('estimate_id').references(() => estimates.id),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull().default('0'),
  amountPaid: numeric('amount_paid', { precision: 10, scale: 2 }).notNull().default('0'),
  balanceDue: numeric('balance_due', { precision: 10, scale: 2 }).notNull().default('0'),
  notes: text('notes'),
  customerMessage: text('customer_message'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidReason: text('void_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('invoices_customer_idx').on(t.customerId),
  index('invoices_status_idx').on(t.status),
  index('invoices_due_date_idx').on(t.dueDate),
]);

export const invoiceLineItems = pgTable('invoice_line_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  catalogItemId: uuid('catalog_item_id'),
  description: varchar('description', { length: 500 }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  taxRateId: uuid('tax_rate_id').references(() => taxRates.id),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
