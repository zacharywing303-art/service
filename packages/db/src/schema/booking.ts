import { pgTable, uuid, varchar, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { customers } from './customers.js';
import { jobs } from './jobs.js';

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending', 'confirmed', 'cancelled', 'completed',
]);

export const bookingRequests = pgTable('booking_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }),
  serviceRequested: varchar('service_requested', { length: 255 }).notNull(),
  preferredDate: timestamp('preferred_date', { withTimezone: true }).notNull(),
  preferredTimeSlot: varchar('preferred_time_slot', { length: 50 }),
  description: text('description'),
  address: text('address'),
  status: bookingStatusEnum('status').notNull().default('pending'),
  customerId: uuid('customer_id').references(() => customers.id),
  jobId: uuid('job_id').references(() => jobs.id),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('booking_status_idx').on(t.status),
  index('booking_date_idx').on(t.preferredDate),
]);
