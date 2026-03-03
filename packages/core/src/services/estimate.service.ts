import { eq, sql, count } from 'drizzle-orm';
import { estimates, estimateLineItems, companySettings } from '@openfsm/db';
import type { Database } from '@openfsm/db';
import { NotFoundError, InvalidStateTransitionError } from '../errors/index.js';
import type { CreateEstimateInput, PaginationParams, PaginatedResult } from '../types/index.js';
import { getOffset, paginate } from '../utils/pagination.js';
import { generateDocumentNumber, incrementNumber } from '../utils/invoice-number.js';

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent'],
  sent: ['approved', 'declined'],
  approved: ['converted'],
  declined: ['draft'],
  converted: [],
};

export class EstimateService {
  constructor(private db: Database) {}

  async list(params: PaginationParams): Promise<PaginatedResult<typeof estimates.$inferSelect>> {
    const [{ value: total }] = await this.db.select({ value: count() }).from(estimates);
    const data = await this.db.select().from(estimates)
      .limit(params.limit).offset(getOffset(params))
      .orderBy(sql`${estimates.createdAt} DESC`);
    return paginate(data, total, params);
  }

  async getById(id: string) {
    const [estimate] = await this.db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
    if (!estimate) throw new NotFoundError('Estimate', id);
    return estimate;
  }

  async getLineItems(estimateId: string) {
    return this.db.select().from(estimateLineItems)
      .where(eq(estimateLineItems.estimateId, estimateId))
      .orderBy(sql`${estimateLineItems.sortOrder} ASC`);
  }

  async create(input: CreateEstimateInput) {
    // Generate number
    const [settings] = await this.db.select().from(companySettings).limit(1);
    const number = generateDocumentNumber(
      settings?.estimatePrefix || 'EST-',
      settings?.nextEstimateNumber || '1001',
    );

    // Calculate totals
    let subtotal = 0;
    for (const item of input.lineItems) {
      subtotal += parseFloat(item.quantity) * parseFloat(item.unitPrice);
    }
    const taxAmount = subtotal * 0.095; // Default tax rate; in production, calculate per line item
    const total = subtotal + taxAmount;

    const [estimate] = await this.db.insert(estimates).values({
      number,
      customerId: input.customerId,
      locationId: input.locationId,
      jobId: input.jobId,
      notes: input.notes,
      customerMessage: input.customerMessage,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
    }).returning();

    // Insert line items
    const lineItemValues = input.lineItems.map((item, i) => ({
      estimateId: estimate.id,
      catalogItemId: item.catalogItemId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRateId: item.taxRateId,
      sortOrder: item.sortOrder ?? i,
    }));
    await this.db.insert(estimateLineItems).values(lineItemValues);

    // Increment next number
    if (settings) {
      await this.db.update(companySettings).set({
        nextEstimateNumber: incrementNumber(settings.nextEstimateNumber),
      }).where(eq(companySettings.id, settings.id));
    }

    return estimate;
  }

  async updateStatus(id: string, newStatus: string) {
    const estimate = await this.getById(id);
    const allowed = VALID_TRANSITIONS[estimate.status];
    if (!allowed?.includes(newStatus)) {
      throw new InvalidStateTransitionError('Estimate', estimate.status, newStatus);
    }

    const updates: Record<string, any> = { status: newStatus, updatedAt: new Date() };
    if (newStatus === 'sent') updates.sentAt = new Date();
    if (newStatus === 'approved') updates.approvedAt = new Date();
    if (newStatus === 'declined') updates.declinedAt = new Date();

    const [updated] = await this.db.update(estimates).set(updates).where(eq(estimates.id, id)).returning();
    return updated;
  }

  async accept(id: string, signatureData?: string) {
    const estimate = await this.updateStatus(id, 'approved');
    if (signatureData) {
      await this.db.update(estimates).set({ signatureData }).where(eq(estimates.id, id));
    }
    return estimate;
  }
}
