import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanupTestDb, closeTestDb, seedTestCustomer } from '@openfsm/db/test-utils';
import { InvoiceService } from './invoice.service.js';
import { EstimateService } from './estimate.service.js';
import { InvalidStateTransitionError, NotFoundError } from '../errors/index.js';

describe('InvoiceService', () => {
  const db = getTestDb();
  const service = new InvoiceService(db as any);
  const estimateService = new EstimateService(db as any);
  let customerId: string;

  beforeEach(async () => {
    await cleanupTestDb();
    const customer = await seedTestCustomer(db);
    customerId = customer.id;
  });

  afterAll(async () => {
    await closeTestDb();
  });

  const makeInvoiceInput = (overrides = {}) => ({
    customerId,
    notes: 'Test invoice',
    lineItems: [
      {
        description: 'AC Repair Service',
        quantity: '2',
        unitPrice: '100.00',
        sortOrder: 0,
      },
    ],
    ...overrides,
  });

  const makeEstimateInput = () => ({
    customerId,
    lineItems: [
      {
        description: 'Estimate Line Item',
        quantity: '1',
        unitPrice: '200.00',
        sortOrder: 0,
      },
    ],
  });

  describe('create', () => {
    it('creates an invoice with a generated number', async () => {
      const invoice = await service.create(makeInvoiceInput());

      expect(invoice).toBeDefined();
      expect(invoice.id).toBeDefined();
      expect(invoice.number).toMatch(/^INV-/);
      expect(invoice.status).toBe('draft');
      expect(invoice.customerId).toBe(customerId);
    });

    it('calculates subtotal, tax, and total correctly', async () => {
      const invoice = await service.create(makeInvoiceInput());

      // subtotal = 2 * 100 = 200
      expect(parseFloat(invoice.subtotal)).toBe(200);
      // tax = 200 * 0.095 = 19
      expect(parseFloat(invoice.taxAmount)).toBeCloseTo(19, 2);
      // total = 200 + 19 = 219
      expect(parseFloat(invoice.total)).toBeCloseTo(219, 2);
    });

    it('sets balanceDue equal to total on creation', async () => {
      const invoice = await service.create(makeInvoiceInput());
      expect(invoice.balanceDue).toBe(invoice.total);
    });

    it('creates line items for the invoice', async () => {
      const invoice = await service.create(makeInvoiceInput());
      const lineItems = await service.getLineItems(invoice.id);

      expect(lineItems).toHaveLength(1);
      expect(lineItems[0].description).toBe('AC Repair Service');
    });

    it('sets a default due date when none provided', async () => {
      const invoice = await service.create(makeInvoiceInput());
      expect(invoice.dueDate).toBeDefined();
    });
  });

  describe('createFromEstimate', () => {
    it('creates an invoice from an approved estimate', async () => {
      const estimate = await estimateService.create(makeEstimateInput());
      await estimateService.updateStatus(estimate.id, 'sent');
      await estimateService.updateStatus(estimate.id, 'approved');

      const invoice = await service.createFromEstimate(estimate.id);

      expect(invoice).toBeDefined();
      expect(invoice.number).toMatch(/^INV-/);
      expect(invoice.customerId).toBe(customerId);
      expect(invoice.estimateId).toBe(estimate.id);
    });

    it('copies line items from the estimate', async () => {
      const estimate = await estimateService.create(makeEstimateInput());
      await estimateService.updateStatus(estimate.id, 'sent');
      await estimateService.updateStatus(estimate.id, 'approved');

      const invoice = await service.createFromEstimate(estimate.id);
      const lineItems = await service.getLineItems(invoice.id);

      expect(lineItems).toHaveLength(1);
      expect(lineItems[0].description).toBe('Estimate Line Item');
    });

    it('marks the estimate as converted', async () => {
      const estimate = await estimateService.create(makeEstimateInput());
      await estimateService.updateStatus(estimate.id, 'sent');
      await estimateService.updateStatus(estimate.id, 'approved');

      await service.createFromEstimate(estimate.id);

      const updated = await estimateService.getById(estimate.id);
      expect(updated.status).toBe('converted');
    });

    it('throws NotFoundError for a nonexistent estimate', async () => {
      await expect(
        service.createFromEstimate('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getById', () => {
    it('returns the invoice by id', async () => {
      const created = await service.create(makeInvoiceInput());
      const found = await service.getById(created.id);

      expect(found.id).toBe(created.id);
    });

    it('throws NotFoundError for a nonexistent id', async () => {
      await expect(
        service.getById('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    it('returns paginated invoices', async () => {
      await service.create(makeInvoiceInput());
      await service.create(makeInvoiceInput());

      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('filters by status', async () => {
      const invoice = await service.create(makeInvoiceInput());
      await service.create(makeInvoiceInput());
      await service.updateStatus(invoice.id, 'sent');

      const result = await service.list(
        { page: 1, limit: 10, sortOrder: 'desc' },
        { status: 'sent' },
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('sent');
    });
  });

  describe('send (draft -> sent)', () => {
    it('transitions invoice from draft to sent', async () => {
      const invoice = await service.create(makeInvoiceInput());
      const sent = await service.updateStatus(invoice.id, 'sent');

      expect(sent.status).toBe('sent');
      expect(sent.sentAt).toBeDefined();
    });
  });

  describe('void', () => {
    it('voids a sent invoice', async () => {
      const invoice = await service.create(makeInvoiceInput());
      await service.updateStatus(invoice.id, 'sent');
      const voided = await service.updateStatus(invoice.id, 'void');

      expect(voided.status).toBe('void');
      expect(voided.voidedAt).toBeDefined();
    });

    it('throws InvalidStateTransitionError when voiding a draft', async () => {
      const invoice = await service.create(makeInvoiceInput());

      await expect(
        service.updateStatus(invoice.id, 'void'),
      ).rejects.toThrow(InvalidStateTransitionError);
    });

    it('throws InvalidStateTransitionError when voiding a paid invoice', async () => {
      const invoice = await service.create(makeInvoiceInput());
      await service.updateStatus(invoice.id, 'sent');
      await service.updateStatus(invoice.id, 'paid');

      await expect(
        service.updateStatus(invoice.id, 'void'),
      ).rejects.toThrow(InvalidStateTransitionError);
    });
  });

  describe('updatePaymentTotals', () => {
    it('updates amountPaid and balanceDue', async () => {
      const invoice = await service.create(makeInvoiceInput());
      await service.updateStatus(invoice.id, 'sent');

      const total = parseFloat(invoice.total);
      const updated = await service.updatePaymentTotals(invoice.id, 50);

      expect(parseFloat(updated.amountPaid)).toBe(50);
      expect(parseFloat(updated.balanceDue)).toBeCloseTo(total - 50, 2);
    });

    it('marks invoice as paid when fully paid', async () => {
      const invoice = await service.create(makeInvoiceInput());
      await service.updateStatus(invoice.id, 'sent');

      const total = parseFloat(invoice.total);
      const updated = await service.updatePaymentTotals(invoice.id, total);

      expect(updated.status).toBe('paid');
      expect(parseFloat(updated.balanceDue)).toBe(0);
    });

    it('marks invoice as partial when partially paid', async () => {
      const invoice = await service.create(makeInvoiceInput());
      await service.updateStatus(invoice.id, 'sent');

      const updated = await service.updatePaymentTotals(invoice.id, 10);

      expect(updated.status).toBe('partial');
    });
  });
});
