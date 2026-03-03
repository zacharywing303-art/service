import { pgTable, uuid, varchar, text, timestamp, integer, index } from 'drizzle-orm/pg-core';

export const attachments = pgTable('attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),
  storagePath: text('storage_path').notNull(),
  storageProvider: varchar('storage_provider', { length: 20 }).notNull().default('local'),
  uploadedById: uuid('uploaded_by_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('attachments_entity_idx').on(t.entityType, t.entityId),
]);
