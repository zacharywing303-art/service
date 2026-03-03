import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanupTestDb, closeTestDb, seedTestCustomer } from '@openfsm/db/test-utils';
import { EstimateService } from './estimate.service.js';
import { InvalidStateTransitionError, NotFoundError } from '../errors/index.js';

describe('EstimateService', () => {
  const db = getTestDb();
  const service = new EstimateService(db as any);
  let customerId: string;

  beforeEach(async () => {
    await cleanupTestDb();
    const customer = await seedTestCustomer(db);
    customerId = customer.id;
  });

  afterAll(async () => {
    await closeTestDb();
  });

  const makeEstimateInput = (overrides = {}) => ({
    customerId,
    notes: 'Test estimate',
    lineItems: [
      {
        description: 'AC Repair Service',
        quantity: '2',
        unitPrice: '100.00',
        sortOrder: 0,
      },
      {
        description: 'Air Filter',
        quantity: '1',
        unitPrice: '25.00',
        sortOrder: 1,
      },
    ],
    ...overrides,
  });

  describe('create', () => {
    it('creates an estimate with a generated number', async () => {
      const estimate = await service.create(makeEstimateInput());

      expect(estimate).toBeDefined();
      expect(estimate.id).toBeDefined();
      expect(estimate.number).toMatch(/^EST-/);
      expect(estimate.status).toBe('draft');
      expect(estimate.customerId).toBe(customerId);
    });

    it('calculates subtotal, tax, and total correctly', async () => {
      const estimate = await service.create(makeEstimateInput());

      // subtotal = (2 * 100) + (1 * 25) = 225
      expect(parseFloat(estimate.subtotal)).toBe(225);
      // tax = 225 * 0.095 = 21.375
      expect(parseFloat(estimate.taxAmount)).toBeCloseTo(21.375, 2);
      // total = 225 + 21.375 = 246.375
      expect(parseFloat(estimate.total)).toBeCloseTo(246.375, 2);
    });

    it('creates line items for the estimate', async () => {
      const estimate = await service.create(makeEstimateInput());
      const lineItems = await service.getLineItems(estimate.id);

      expect(lineItems).toHaveLength(2);
      expect(lineItems[0].description).toBe('AC Repair Service');
      expect(lineItems[1].description).toBe('Air Filter');
    });
  });

  describe('getById', () => {
    it('returns the estimate by id', async () => {
      const created = await service.create(makeEstimateInput());
      const found = await service.getById(created.id);

      expect(found.id).toBe(created.id);
      expect(found.number).toBe(created.number);
    });

    it('throws NotFoundError for a nonexistent id', async () => {
      await expect(
        service.getById('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    it('returns paginated estimates', async () => {
      await service.create(makeEstimateInput());
      await service.create(makeEstimateInput());

      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('status transitions', () => {
    it('sends a draft estimate (draft -> sent)', async () => {
      const estimate = await service.create(makeEstimateInput());
      const sent = await service.updateStatus(estimate.id, 'sent');

      expect(sent.status).toBe('sent');
      expect(sent.sentAt).toBeDefined();
    });

    it('accepts a sent estimate (sent -> approved)', async () => {
      const estimate = await service.create(makeEstimateInput());
      await service.updateStatus(estimate.id, 'sent');
      const approved = await service.updateStatus(estimate.id, 'approved');

      expect(approved.status).toBe('approved');
      expect(approved.approvedAt).toBeDefined();
    });

    it('declines a sent estimate (sent -> declined)', async () => {
      const estimate = await service.create(makeEstimateInput());
      await service.updateStatus(estimate.id, 'sent');
      const declined = await service.updateStatus(estimate.id, 'declined');

      expect(declined.status).toBe('declined');
      expect(declined.declinedAt).toBeDefined();
    });

    it('allows re-drafting a declined estimate (declined -> draft)', async () => {
      const estimate = await service.create(makeEstimateInput());
      await service.updateStatus(estimate.id, 'sent');
      await service.updateStatus(estimate.id, 'declined');
      const redrafted = await service.updateStatus(estimate.id, 'draft');

      expect(redrafted.status).toBe('draft');
    });

    it('throws InvalidStateTransitionError for invalid transition (draft -> approved)', async () => {
      const estimate = await service.create(makeEstimateInput());

      await expect(
        service.updateStatus(estimate.id, 'approved'),
      ).rejects.toThrow(InvalidStateTransitionError);
    });

    it('throws InvalidStateTransitionError from converted state', async () => {
      const estimate = await service.create(makeEstimateInput());
      await service.updateStatus(estimate.id, 'sent');
      await service.updateStatus(estimate.id, 'approved');
      await service.updateStatus(estimate.id, 'converted');

      await expect(
        service.updateStatus(estimate.id, 'draft'),
      ).rejects.toThrow(InvalidStateTransitionError);
    });
  });

  describe('accept', () => {
    it('accepts an estimate and stores signature data', async () => {
      const estimate = await service.create(makeEstimateInput());
      await service.updateStatus(estimate.id, 'sent');

      const accepted = await service.accept(estimate.id, 'data:image/png;base64,abc123');

      expect(accepted.status).toBe('approved');
    });

    it('accepts an estimate without signature data', async () => {
      const estimate = await service.create(makeEstimateInput());
      await service.updateStatus(estimate.id, 'sent');

      const accepted = await service.accept(estimate.id);

      expect(accepted.status).toBe('approved');
    });
  });
});
