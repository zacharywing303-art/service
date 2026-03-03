import { eq, sql, count } from 'drizzle-orm';
import { payments, invoices } from '@openfsm/db';
import type { Database } from '@openfsm/db';
import { NotFoundError, ConflictError, ValidationError } from '../errors/index.js';
import type { RecordPaymentInput, PaginationParams, PaginatedResult } from '../types/index.js';
import { getOffset, paginate } from '../utils/pagination.js';
import { InvoiceService } from './invoice.service.js';

export class PaymentService {
  private invoiceService: InvoiceService;

  constructor(private db: Database) {
    this.invoiceService = new InvoiceService(db);
  }

  async list(params: PaginationParams): Promise<PaginatedResult<typeof payments.$inferSelect>> {
    const [{ value: total }] = await this.db.select({ value: count() }).from(payments);
    const data = await this.db.select().from(payments)
      .limit(params.limit).offset(getOffset(params))
      .orderBy(sql`${payments.createdAt} DESC`);
    return paginate(data, total, params);
  }

  async getById(id: string) {
    const [payment] = await this.db.select().from(payments).where(eq(payments.id, id)).limit(1);
    if (!payment) throw new NotFoundError('Payment', id);
    return payment;
  }

  async record(input: RecordPaymentInput) {
    // Idempotency check
    if (input.idempotencyKey) {
      const [existing] = await this.db.select().from(payments)
        .where(eq(payments.idempotencyKey, input.idempotencyKey)).limit(1);
      if (existing) return existing;
    }

    // Validate invoice exists and has balance
    const invoice = await this.invoiceService.getById(input.invoiceId);
    const amount = parseFloat(input.amount);
    const balanceDue = parseFloat(invoice.balanceDue);

    if (amount <= 0) {
      throw new ValidationError('Payment amount must be positive');
    }
    if (amount > balanceDue) {
      throw new ValidationError(`Payment amount ($${amount}) exceeds balance due ($${balanceDue})`);
    }

    const [payment] = await this.db.insert(payments).values({
      invoiceId: input.invoiceId,
      customerId: invoice.customerId,
      amount: input.amount,
      method: input.method,
      reference: input.reference,
      notes: input.notes,
      idempotencyKey: input.idempotencyKey,
      status: 'completed',
    }).returning();

    // Update invoice totals
    await this.invoiceService.updatePaymentTotals(input.invoiceId, amount);

    return payment;
  }

  async getByInvoice(invoiceId: string) {
    return this.db.select().from(payments).where(eq(payments.invoiceId, invoiceId))
      .orderBy(sql`${payments.createdAt} DESC`);
  }
}
