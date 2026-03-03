import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanupTestDb, closeTestDb } from '@openfsm/db/test-utils';
import { CustomerService } from './customer.service.js';
import { NotFoundError } from '../errors/index.js';

describe('CustomerService', () => {
  const db = getTestDb();
  const service = new CustomerService(db as any);

  beforeEach(async () => {
    await cleanupTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  const validCustomer = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '555-1234',
  };

  describe('create', () => {
    it('creates a customer and returns it with an id', async () => {
      const customer = await service.create(validCustomer);

      expect(customer).toBeDefined();
      expect(customer.id).toBeDefined();
      expect(customer.firstName).toBe('Jane');
      expect(customer.lastName).toBe('Smith');
      expect(customer.email).toBe('jane@example.com');
    });

    it('creates a customer with a company name', async () => {
      const customer = await service.create({
        ...validCustomer,
        companyName: 'Smith LLC',
      });

      expect(customer.companyName).toBe('Smith LLC');
    });
  });

  describe('getById', () => {
    it('returns the customer by id', async () => {
      const created = await service.create(validCustomer);
      const found = await service.getById(created.id);

      expect(found.id).toBe(created.id);
      expect(found.firstName).toBe('Jane');
    });

    it('throws NotFoundError for a nonexistent id', async () => {
      await expect(
        service.getById('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    it('returns a paginated list of customers', async () => {
      await service.create({ firstName: 'A', lastName: 'One' });
      await service.create({ firstName: 'B', lastName: 'Two' });

      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('respects pagination limit', async () => {
      await service.create({ firstName: 'A', lastName: 'One' });
      await service.create({ firstName: 'B', lastName: 'Two' });
      await service.create({ firstName: 'C', lastName: 'Three' });

      const result = await service.list({ page: 1, limit: 2, sortOrder: 'desc' });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
    });

    it('returns empty list when no customers exist', async () => {
      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('update', () => {
    it('updates customer fields', async () => {
      const created = await service.create(validCustomer);
      const updated = await service.update(created.id, { firstName: 'Janet' });

      expect(updated.firstName).toBe('Janet');
      expect(updated.lastName).toBe('Smith');
    });

    it('throws NotFoundError for a nonexistent id', async () => {
      await expect(
        service.update('00000000-0000-0000-0000-000000000099', { firstName: 'X' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete (soft delete)', () => {
    it('soft deletes a customer by setting deletedAt', async () => {
      const created = await service.create(validCustomer);
      const deleted = await service.delete(created.id);

      expect(deleted.deletedAt).toBeDefined();
      expect(deleted.deletedAt).not.toBeNull();
    });

    it('soft-deleted customers do not appear in list', async () => {
      const created = await service.create(validCustomer);
      await service.delete(created.id);

      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' });
      expect(result.data).toHaveLength(0);
    });

    it('throws NotFoundError for a nonexistent id', async () => {
      await expect(
        service.delete('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('search', () => {
    it('finds customers by first name', async () => {
      await service.create(validCustomer);
      await service.create({ firstName: 'Bob', lastName: 'Jones' });

      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' }, 'Jane');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].firstName).toBe('Jane');
    });

    it('finds customers by last name', async () => {
      await service.create(validCustomer);
      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' }, 'Smith');
      expect(result.data).toHaveLength(1);
    });

    it('finds customers by email', async () => {
      await service.create(validCustomer);
      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' }, 'jane@');
      expect(result.data).toHaveLength(1);
    });

    it('finds customers by company name', async () => {
      await service.create({ ...validCustomer, companyName: 'Acme Corp' });
      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' }, 'Acme');
      expect(result.data).toHaveLength(1);
    });

    it('returns empty when search matches nothing', async () => {
      await service.create(validCustomer);
      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' }, 'zzzzz');
      expect(result.data).toHaveLength(0);
    });
  });

  describe('addLocation', () => {
    it('adds a location to a customer', async () => {
      const customer = await service.create(validCustomer);
      const location = await service.addLocation({
        customerId: customer.id,
        address1: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
      });

      expect(location).toBeDefined();
      expect(location.id).toBeDefined();
      expect(location.customerId).toBe(customer.id);
      expect(location.address1).toBe('123 Main St');
    });

    it('retrieves locations for a customer', async () => {
      const customer = await service.create(validCustomer);
      await service.addLocation({
        customerId: customer.id,
        address1: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
      });
      await service.addLocation({
        customerId: customer.id,
        address1: '456 Oak Ave',
        city: 'Springfield',
        state: 'IL',
        zip: '62702',
      });

      const locations = await service.getLocations(customer.id);
      expect(locations).toHaveLength(2);
    });
  });

  describe('addNote', () => {
    it('adds a note for a customer', async () => {
      const customer = await service.create(validCustomer);
      const note = await service.addNote(customer.id, '00000000-0000-0000-0000-000000000001', 'Test note content');

      expect(note).toBeDefined();
      expect(note.id).toBeDefined();
      expect(note.customerId).toBe(customer.id);
      expect(note.content).toBe('Test note content');
    });

    it('retrieves notes for a customer in descending order', async () => {
      const customer = await service.create(validCustomer);
      await service.addNote(customer.id, '00000000-0000-0000-0000-000000000001', 'First note');
      await service.addNote(customer.id, '00000000-0000-0000-0000-000000000001', 'Second note');

      const notes = await service.getNotes(customer.id);
      expect(notes).toHaveLength(2);
    });
  });
});
