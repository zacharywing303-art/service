import { pgTable, uuid, varchar, text, timestamp, numeric, integer, pgEnum, index } from 'drizzle-orm/pg-core';
import { customers } from './customers.js';
import { locations } from './customers.js';
import { jobs } from './jobs.js';
import { taxRates } from './catalog.js';

export const estimateStatusEnum = pgEnum('estimate_status', [
  'draft', 'sent', 'approved', 'declined', 'converted',
]);

export const estimates = pgTable('estimates', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  locationId: uuid('location_id').references(() => locations.id),
  jobId: uuid('job_id').references(() => jobs.id),
  status: estimateStatusEnum('status').notNull().default('draft'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull().default('0'),
  notes: text('notes'),
  customerMessage: text('customer_message'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  declinedAt: timestamp('declined_at', { withTimezone: true }),
  signatureData: text('signature_data'),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  convertedInvoiceId: uuid('converted_invoice_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('estimates_customer_idx').on(t.customerId),
  index('estimates_status_idx').on(t.status),
]);

export const estimateLineItems = pgTable('estimate_line_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').notNull().references(() => estimates.id, { onDelete: 'cascade' }),
  catalogItemId: uuid('catalog_item_id'),
  description: varchar('description', { length: 500 }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  taxRateId: uuid('tax_rate_id').references(() => taxRates.id),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
