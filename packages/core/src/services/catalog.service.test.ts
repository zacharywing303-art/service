import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanupTestDb, closeTestDb } from '@openfsm/db/test-utils';
import { taxRates } from '@openfsm/db';
import { CatalogService } from './catalog.service.js';
import { NotFoundError } from '../errors/index.js';

describe('CatalogService', () => {
  const db = getTestDb();
  const service = new CatalogService(db as any);

  beforeEach(async () => {
    await cleanupTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  describe('createItem', () => {
    it('creates a catalog item', async () => {
      const item = await service.createItem({
        name: 'AC Repair',
        description: 'Standard AC repair service',
        type: 'service',
        unitPrice: '150.00',
        unit: 'each',
        taxable: true,
      });

      expect(item).toBeDefined();
      expect(item.id).toBeDefined();
      expect(item.name).toBe('AC Repair');
      expect(item.unitPrice).toBe('150.00');
      expect(item.type).toBe('service');
    });

    it('creates a part catalog item', async () => {
      const item = await service.createItem({
        name: 'Air Filter',
        type: 'part',
        unitPrice: '25.00',
        unit: 'each',
        taxable: true,
      });

      expect(item.type).toBe('part');
    });
  });

  describe('listItems', () => {
    it('returns paginated catalog items', async () => {
      await service.createItem({ name: 'Item A', unitPrice: '10.00', type: 'service', unit: 'each', taxable: true });
      await service.createItem({ name: 'Item B', unitPrice: '20.00', type: 'part', unit: 'each', taxable: true });

      const result = await service.listItems({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('returns items sorted by name ascending', async () => {
      await service.createItem({ name: 'Zebra', unitPrice: '10.00', type: 'service', unit: 'each', taxable: true });
      await service.createItem({ name: 'Alpha', unitPrice: '20.00', type: 'service', unit: 'each', taxable: true });

      const result = await service.listItems({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data[0].name).toBe('Alpha');
      expect(result.data[1].name).toBe('Zebra');
    });

    it('returns empty list when no items exist', async () => {
      const result = await service.listItems({ page: 1, limit: 10, sortOrder: 'desc' });
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateItem', () => {
    it('updates an existing catalog item', async () => {
      const item = await service.createItem({
        name: 'Old Name',
        unitPrice: '50.00',
        type: 'service',
        unit: 'each',
        taxable: true,
      });

      const updated = await service.updateItem(item.id, { name: 'New Name', unitPrice: '75.00' });

      expect(updated.name).toBe('New Name');
      expect(updated.unitPrice).toBe('75.00');
    });

    it('throws NotFoundError for a nonexistent item', async () => {
      await expect(
        service.updateItem('00000000-0000-0000-0000-000000000099', { name: 'X' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getItemById', () => {
    it('returns a catalog item by id', async () => {
      const item = await service.createItem({
        name: 'Test Item',
        unitPrice: '30.00',
        type: 'material',
        unit: 'each',
        taxable: false,
      });

      const found = await service.getItemById(item.id);
      expect(found.id).toBe(item.id);
      expect(found.name).toBe('Test Item');
    });

    it('throws NotFoundError for a nonexistent id', async () => {
      await expect(
        service.getItemById('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('tax rates', () => {
    it('creates and lists tax rates', async () => {
      // Insert tax rates directly since the service only lists them
      await (db as any).insert(taxRates).values({
        name: 'Standard Tax',
        rate: '0.0950',
        isDefault: true,
      });
      await (db as any).insert(taxRates).values({
        name: 'Reduced Tax',
        rate: '0.0500',
        isDefault: false,
      });

      const rates = await service.listTaxRates();

      expect(rates).toHaveLength(2);
      expect(rates.map((r: any) => r.name)).toContain('Standard Tax');
      expect(rates.map((r: any) => r.name)).toContain('Reduced Tax');
    });

    it('gets default tax rate', async () => {
      await (db as any).insert(taxRates).values({
        name: 'Default Tax',
        rate: '0.0950',
        isDefault: true,
      });

      const defaultRate = await service.getDefaultTaxRate();

      expect(defaultRate).toBeDefined();
      expect(defaultRate!.name).toBe('Default Tax');
      expect(defaultRate!.isDefault).toBe(true);
    });

    it('returns undefined when no default tax rate exists', async () => {
      const defaultRate = await service.getDefaultTaxRate();
      expect(defaultRate).toBeUndefined();
    });
  });
});
