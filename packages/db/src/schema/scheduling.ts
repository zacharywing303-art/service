import { pgTable, uuid, varchar, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { jobs } from './jobs.js';
import { users } from './users.js';
import { customers } from './customers.js';

export const scheduleEventTypeEnum = pgEnum('schedule_event_type', [
  'job', 'time_off', 'meeting', 'other',
]);

export const scheduleEvents = pgTable('schedule_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  technicianId: uuid('technician_id').notNull().references(() => users.id),
  jobId: uuid('job_id').references(() => jobs.id),
  customerId: uuid('customer_id').references(() => customers.id),
  type: scheduleEventTypeEnum('type').notNull().default('job'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  googleCalendarEventId: varchar('google_calendar_event_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('schedule_tech_idx').on(t.technicianId),
  index('schedule_time_idx').on(t.startTime, t.endTime),
  index('schedule_job_idx').on(t.jobId),
]);
