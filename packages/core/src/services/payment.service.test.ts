import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanupTestDb, closeTestDb, seedTestCustomer } from '@openfsm/db/test-utils';
import { PaymentService } from './payment.service.js';
import { InvoiceService } from './invoice.service.js';
import { ValidationError } from '../errors/index.js';

describe('PaymentService', () => {
  const db = getTestDb();
  const paymentService = new PaymentService(db as any);
  const invoiceService = new InvoiceService(db as any);
  let customerId: string;

  beforeEach(async () => {
    await cleanupTestDb();
    const customer = await seedTestCustomer(db);
    customerId = customer.id;
  });

  afterAll(async () => {
    await closeTestDb();
  });

  async function createSentInvoice() {
    const invoice = await invoiceService.create({
      customerId,
      lineItems: [
        {
          description: 'Service',
          quantity: '1',
          unitPrice: '100.00',
          sortOrder: 0,
        },
      ],
    });
    await invoiceService.updateStatus(invoice.id, 'sent');
    return invoiceService.getById(invoice.id);
  }

  describe('record', () => {
    it('records a payment against an invoice', async () => {
      const invoice = await createSentInvoice();

      const payment = await paymentService.record({
        invoiceId: invoice.id,
        amount: '50.00',
        method: 'credit_card',
      });

      expect(payment).toBeDefined();
      expect(payment.id).toBeDefined();
      expect(payment.invoiceId).toBe(invoice.id);
      expect(payment.amount).toBe('50.00');
      expect(payment.method).toBe('credit_card');
      expect(payment.status).toBe('completed');
    });

    it('updates invoice balanceDue after payment', async () => {
      const invoice = await createSentInvoice();
      await paymentService.record({
        invoiceId: invoice.id,
        amount: '50.00',
        method: 'cash',
      });

      const updated = await invoiceService.getById(invoice.id);
      expect(parseFloat(updated.amountPaid)).toBe(50);
    });

    it('fully pays an invoice when amount matches balance', async () => {
      const invoice = await createSentInvoice();
      const balanceDue = invoice.balanceDue;

      await paymentService.record({
        invoiceId: invoice.id,
        amount: balanceDue,
        method: 'bank_transfer',
      });

      const updated = await invoiceService.getById(invoice.id);
      expect(updated.status).toBe('paid');
      expect(parseFloat(updated.balanceDue)).toBe(0);
    });

    it('throws ValidationError for zero amount', async () => {
      const invoice = await createSentInvoice();

      await expect(
        paymentService.record({
          invoiceId: invoice.id,
          amount: '0',
          method: 'cash',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when amount exceeds balance', async () => {
      const invoice = await createSentInvoice();
      const overAmount = (parseFloat(invoice.balanceDue) + 100).toFixed(2);

      await expect(
        paymentService.record({
          invoiceId: invoice.id,
          amount: overAmount,
          method: 'cash',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('idempotency', () => {
    it('returns existing payment when idempotency key matches', async () => {
      const invoice = await createSentInvoice();
      const idempotencyKey = 'unique-key-123';

      const first = await paymentService.record({
        invoiceId: invoice.id,
        amount: '50.00',
        method: 'credit_card',
        idempotencyKey,
      });

      const second = await paymentService.record({
        invoiceId: invoice.id,
        amount: '50.00',
        method: 'credit_card',
        idempotencyKey,
      });

      expect(second.id).toBe(first.id);
    });

    it('creates separate payments with different idempotency keys', async () => {
      const invoice = await createSentInvoice();

      const first = await paymentService.record({
        invoiceId: invoice.id,
        amount: '25.00',
        method: 'credit_card',
        idempotencyKey: 'key-1',
      });

      const second = await paymentService.record({
        invoiceId: invoice.id,
        amount: '25.00',
        method: 'credit_card',
        idempotencyKey: 'key-2',
      });

      expect(second.id).not.toBe(first.id);
    });
  });

  describe('list', () => {
    it('returns paginated payments', async () => {
      const invoice = await createSentInvoice();
      await paymentService.record({
        invoiceId: invoice.id,
        amount: '25.00',
        method: 'cash',
      });
      await paymentService.record({
        invoiceId: invoice.id,
        amount: '25.00',
        method: 'check',
      });

      const result = await paymentService.list({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('returns empty list when no payments exist', async () => {
      const result = await paymentService.list({ page: 1, limit: 10, sortOrder: 'desc' });
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getByInvoice', () => {
    it('returns payments for a specific invoice', async () => {
      const invoice = await createSentInvoice();
      await paymentService.record({
        invoiceId: invoice.id,
        amount: '25.00',
        method: 'cash',
      });

      const payments = await paymentService.getByInvoice(invoice.id);
      expect(payments).toHaveLength(1);
      expect(payments[0].invoiceId).toBe(invoice.id);
    });

    it('returns empty array for invoice with no payments', async () => {
      const invoice = await createSentInvoice();
      const payments = await paymentService.getByInvoice(invoice.id);
      expect(payments).toHaveLength(0);
    });
  });
});
