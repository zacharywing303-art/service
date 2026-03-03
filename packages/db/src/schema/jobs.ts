import { pgTable, uuid, varchar, text, timestamp, numeric, integer, pgEnum, index } from 'drizzle-orm/pg-core';
import { customers } from './customers.js';
import { locations } from './customers.js';
import { users } from './users.js';

export const jobStatusEnum = pgEnum('job_status', [
  'pending', 'scheduled', 'in_progress', 'completed', 'cancelled',
]);

export const jobPriorityEnum = pgEnum('job_priority', ['low', 'normal', 'high', 'emergency']);

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: integer('number').notNull().unique(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  locationId: uuid('location_id').references(() => locations.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: jobStatusEnum('status').notNull().default('pending'),
  priority: jobPriorityEnum('priority').notNull().default('normal'),
  scheduledStart: timestamp('scheduled_start', { withTimezone: true }),
  scheduledEnd: timestamp('scheduled_end', { withTimezone: true }),
  actualStart: timestamp('actual_start', { withTimezone: true }),
  actualEnd: timestamp('actual_end', { withTimezone: true }),
  internalNotes: text('internal_notes'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('jobs_customer_idx').on(t.customerId),
  index('jobs_status_idx').on(t.status),
  index('jobs_scheduled_idx').on(t.scheduledStart),
]);

export const jobAssignments = pgTable('job_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  technicianId: uuid('technician_id').notNull().references(() => users.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
});

export const jobTimeEntries = pgTable('job_time_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  technicianId: uuid('technician_id').notNull().references(() => users.id),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  durationMinutes: integer('duration_minutes'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const jobMaterials = pgTable('job_materials', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  catalogItemId: uuid('catalog_item_id'),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
