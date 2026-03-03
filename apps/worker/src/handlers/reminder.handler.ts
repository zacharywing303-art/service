import { sql } from 'drizzle-orm';
import { invoices } from '@openfsm/db';
import type { Database } from '@openfsm/db';

export async function handleInvoiceReminder(_data: unknown, db: Database) {
  console.log('Checking for overdue invoices...');
  const now = new Date();
  const overdueInvoices = await db.select().from(invoices).where(
    sql`${invoices.status} IN ('sent', 'partial') AND ${invoices.dueDate} < ${now}`,
  );
  for (const inv of overdueInvoices) {
    await db.update(invoices).set({ status: 'overdue', updatedAt: now }).where(sql`${invoices.id} = ${inv.id}`);
    console.log(`Invoice ${inv.number} marked overdue. Balance: $${inv.balanceDue}`);
  }
  console.log(`Processed ${overdueInvoices.length} overdue invoices`);
}
