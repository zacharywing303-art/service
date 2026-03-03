import { eq, sql, count, and } from 'drizzle-orm';
import { invoices, invoiceLineItems, companySettings, estimates, estimateLineItems } from '@openfsm/db';
import type { Database } from '@openfsm/db';
import { NotFoundError, InvalidStateTransitionError } from '../errors/index.js';
import type { CreateInvoiceInput, PaginationParams, PaginatedResult } from '../types/index.js';
import { getOffset, paginate } from '../utils/pagination.js';
import { generateDocumentNumber, incrementNumber } from '../utils/invoice-number.js';

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent'],
  sent: ['paid', 'partial', 'overdue', 'void'],
  partial: ['paid', 'overdue', 'void'],
  overdue: ['paid', 'partial', 'void'],
  paid: [],
  void: [],
};

export class InvoiceService {
  constructor(private db: Database) {}

  async list(params: PaginationParams, filters?: { status?: string }): Promise<PaginatedResult<typeof invoices.$inferSelect>> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(invoices.status, filters.status as any));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ value: total }] = await this.db.select({ value: count() }).from(invoices).where(where);
    const data = await this.db.select().from(invoices).where(where)
      .limit(params.limit).offset(getOffset(params))
      .orderBy(sql`${invoices.createdAt} DESC`);
    return paginate(data, total, params);
  }

  async getById(id: string) {
    const [invoice] = await this.db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (!invoice) throw new NotFoundError('Invoice', id);
    return invoice;
  }

  async getLineItems(invoiceId: string) {
    return this.db.select().from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId))
      .orderBy(sql`${invoiceLineItems.sortOrder} ASC`);
  }

  async create(input: CreateInvoiceInput) {
    const [settings] = await this.db.select().from(companySettings).limit(1);
    const number = generateDocumentNumber(
      settings?.invoicePrefix || 'INV-',
      settings?.nextInvoiceNumber || '1001',
    );

    let subtotal = 0;
    for (const item of input.lineItems) {
      subtotal += parseFloat(item.quantity) * parseFloat(item.unitPrice);
    }
    const taxAmount = subtotal * 0.095;
    const total = subtotal + taxAmount;

    const dueDate = input.dueDate
      ? new Date(input.dueDate)
      : new Date(Date.now() + parseInt(settings?.defaultPaymentTermsDays || '30') * 86400000);

    const [invoice] = await this.db.insert(invoices).values({
      number,
      customerId: input.customerId,
      locationId: input.locationId,
      jobId: input.jobId,
      estimateId: input.estimateId,
      notes: input.notes,
      customerMessage: input.customerMessage,
      dueDate,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      balanceDue: total.toFixed(2),
    }).returning();

    const lineItemValues = input.lineItems.map((item, i) => ({
      invoiceId: invoice.id,
      catalogItemId: item.catalogItemId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRateId: item.taxRateId,
      sortOrder: item.sortOrder ?? i,
    }));
    await this.db.insert(invoiceLineItems).values(lineItemValues);

    if (settings) {
      await this.db.update(companySettings).set({
        nextInvoiceNumber: incrementNumber(settings.nextInvoiceNumber),
      }).where(eq(companySettings.id, settings.id));
    }

    return invoice;
  }

  async createFromEstimate(estimateId: string) {
    const [estimate] = await this.db.select().from(estimates).where(eq(estimates.id, estimateId)).limit(1);
    if (!estimate) throw new NotFoundError('Estimate', estimateId);

    const lineItems = await this.db.select().from(estimateLineItems)
      .where(eq(estimateLineItems.estimateId, estimateId));

    const invoice = await this.create({
      customerId: estimate.customerId,
      locationId: estimate.locationId ?? undefined,
      jobId: estimate.jobId ?? undefined,
      estimateId,
      lineItems: lineItems.map((li) => ({
        catalogItemId: li.catalogItemId ?? undefined,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        taxRateId: li.taxRateId ?? undefined,
        sortOrder: li.sortOrder,
      })),
    });

    // Mark estimate as converted
    await this.db.update(estimates).set({
      status: 'converted',
      convertedInvoiceId: invoice.id,
      updatedAt: new Date(),
    }).where(eq(estimates.id, estimateId));

    return invoice;
  }

  async updateStatus(id: string, newStatus: string) {
    const invoice = await this.getById(id);
    const allowed = VALID_TRANSITIONS[invoice.status];
    if (!allowed?.includes(newStatus)) {
      throw new InvalidStateTransitionError('Invoice', invoice.status, newStatus);
    }

    const updates: Record<string, any> = { status: newStatus, updatedAt: new Date() };
    if (newStatus === 'sent') updates.sentAt = new Date();
    if (newStatus === 'paid') updates.paidAt = new Date();
    if (newStatus === 'void') updates.voidedAt = new Date();

    const [updated] = await this.db.update(invoices).set(updates).where(eq(invoices.id, id)).returning();
    return updated;
  }

  async updatePaymentTotals(invoiceId: string, amountPaid: number) {
    const invoice = await this.getById(invoiceId);
    const total = parseFloat(invoice.total);
    const newAmountPaid = parseFloat(invoice.amountPaid) + amountPaid;
    const newBalanceDue = total - newAmountPaid;

    let newStatus = invoice.status;
    if (newBalanceDue <= 0) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0 && newBalanceDue > 0) {
      newStatus = 'partial';
    }

    const updates: Record<string, any> = {
      amountPaid: newAmountPaid.toFixed(2),
      balanceDue: Math.max(0, newBalanceDue).toFixed(2),
      status: newStatus,
      updatedAt: new Date(),
    };
    if (newStatus === 'paid') updates.paidAt = new Date();

    const [updated] = await this.db.update(invoices).set(updates).where(eq(invoices.id, invoiceId)).returning();
    return updated;
  }
}
