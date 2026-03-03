import { pgTable, uuid, varchar, text, timestamp, numeric, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const catalogItemTypeEnum = pgEnum('catalog_item_type', ['service', 'part', 'material']);

export const catalogItems = pgTable('catalog_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: catalogItemTypeEnum('type').notNull().default('service'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 50 }).default('each'),
  taxable: boolean('taxable').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const taxRates = pgTable('tax_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  rate: numeric('rate', { precision: 5, scale: 4 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
