import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const TEST_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://openfsm_test:openfsm_test@localhost:5433/openfsm_test';

let testClient: ReturnType<typeof postgres> | null = null;

export function getTestDb() {
  if (!testClient) {
    testClient = postgres(TEST_DATABASE_URL, { max: 5 });
  }
  return drizzle(testClient, { schema });
}

export async function cleanupTestDb() {
  const db = getTestDb();
  // Delete in reverse dependency order
  await db.delete(schema.auditLog);
  await db.delete(schema.attachments);
  await db.delete(schema.magicLinks);
  await db.delete(schema.customerAuth);
  await db.delete(schema.messages);
  await db.delete(schema.bookingRequests);
  await db.delete(schema.payments);
  await db.delete(schema.invoiceLineItems);
  await db.delete(schema.invoices);
  await db.delete(schema.estimateLineItems);
  await db.delete(schema.estimates);
  await db.delete(schema.jobMaterials);
  await db.delete(schema.jobTimeEntries);
  await db.delete(schema.jobAssignments);
  await db.delete(schema.jobs);
  await db.delete(schema.scheduleEvents);
  await db.delete(schema.taxRates);
  await db.delete(schema.catalogItems);
  await db.delete(schema.notes);
  await db.delete(schema.customerTags);
  await db.delete(schema.tags);
  await db.delete(schema.locations);
  await db.delete(schema.contacts);
  await db.delete(schema.customers);
  await db.delete(schema.sessions);
  await db.delete(schema.rolePermissions);
  await db.delete(schema.permissions);
  await db.delete(schema.users);
  await db.delete(schema.siteConfig);
  await db.delete(schema.companySettings);
}

export async function closeTestDb() {
  if (testClient) {
    await testClient.end();
    testClient = null;
  }
}

export async function seedTestUser(db: ReturnType<typeof getTestDb>) {
  const { createHash } = await import('crypto');
  // Simple hash for test - not argon2 since it may not be available in test
  const passwordHash = createHash('sha256').update('password123').digest('hex');

  const [user] = await db.insert(schema.users).values({
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    passwordHash,
    firstName: 'Test',
    lastName: 'User',
    role: 'owner',
  }).returning();
  return user;
}

export async function seedTestCustomer(db: ReturnType<typeof getTestDb>) {
  const [customer] = await db.insert(schema.customers).values({
    id: '00000000-0000-0000-0000-000000000010',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-0100',
    status: 'active',
  }).returning();
  return customer;
}
