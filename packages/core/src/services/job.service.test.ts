import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanupTestDb, closeTestDb, seedTestCustomer } from '@openfsm/db/test-utils';
import { JobService } from './job.service.js';
import { InvalidStateTransitionError, NotFoundError } from '../errors/index.js';

describe('JobService', () => {
  const db = getTestDb();
  const service = new JobService(db as any);
  let customerId: string;

  beforeEach(async () => {
    await cleanupTestDb();
    const customer = await seedTestCustomer(db);
    customerId = customer.id;
  });

  afterAll(async () => {
    await closeTestDb();
  });

  const makeJobInput = (overrides = {}) => ({
    customerId,
    title: 'Fix HVAC Unit',
    description: 'AC not cooling properly',
    priority: 'normal' as const,
    ...overrides,
  });

  describe('create', () => {
    it('creates a job with an auto-incremented number', async () => {
      const job = await service.create(makeJobInput());

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.title).toBe('Fix HVAC Unit');
      expect(job.status).toBe('pending');
      expect(job.number).toBeGreaterThan(1000);
      expect(job.customerId).toBe(customerId);
    });

    it('assigns incrementing numbers to sequential jobs', async () => {
      const job1 = await service.create(makeJobInput());
      const job2 = await service.create(makeJobInput({ title: 'Second job' }));

      expect(job2.number).toBe(job1.number + 1);
    });
  });

  describe('getById', () => {
    it('returns the job by id', async () => {
      const created = await service.create(makeJobInput());
      const found = await service.getById(created.id);

      expect(found.id).toBe(created.id);
      expect(found.title).toBe('Fix HVAC Unit');
    });

    it('throws NotFoundError for a nonexistent id', async () => {
      await expect(
        service.getById('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    it('returns paginated jobs', async () => {
      await service.create(makeJobInput());
      await service.create(makeJobInput({ title: 'Second Job' }));

      const result = await service.list({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('filters by status', async () => {
      const job = await service.create(makeJobInput());
      await service.create(makeJobInput({ title: 'Another' }));
      await service.updateStatus(job.id, 'scheduled');

      const result = await service.list(
        { page: 1, limit: 10, sortOrder: 'desc' },
        { status: 'scheduled' },
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('scheduled');
    });
  });

  describe('updateStatus', () => {
    it('transitions pending -> scheduled', async () => {
      const job = await service.create(makeJobInput());
      const updated = await service.updateStatus(job.id, 'scheduled');

      expect(updated.status).toBe('scheduled');
    });

    it('transitions scheduled -> in_progress and sets actualStart', async () => {
      const job = await service.create(makeJobInput());
      await service.updateStatus(job.id, 'scheduled');
      const updated = await service.updateStatus(job.id, 'in_progress');

      expect(updated.status).toBe('in_progress');
      expect(updated.actualStart).toBeDefined();
    });

    it('transitions in_progress -> completed and sets actualEnd', async () => {
      const job = await service.create(makeJobInput());
      await service.updateStatus(job.id, 'scheduled');
      await service.updateStatus(job.id, 'in_progress');
      const updated = await service.updateStatus(job.id, 'completed');

      expect(updated.status).toBe('completed');
      expect(updated.actualEnd).toBeDefined();
    });

    it('allows cancellation from pending', async () => {
      const job = await service.create(makeJobInput());
      const updated = await service.updateStatus(job.id, 'cancelled');

      expect(updated.status).toBe('cancelled');
    });

    it('allows cancelled -> pending', async () => {
      const job = await service.create(makeJobInput());
      await service.updateStatus(job.id, 'cancelled');
      const updated = await service.updateStatus(job.id, 'pending');

      expect(updated.status).toBe('pending');
    });

    it('throws InvalidStateTransitionError for invalid transition', async () => {
      const job = await service.create(makeJobInput());

      await expect(
        service.updateStatus(job.id, 'completed'),
      ).rejects.toThrow(InvalidStateTransitionError);
    });

    it('throws InvalidStateTransitionError when transitioning from completed', async () => {
      const job = await service.create(makeJobInput());
      await service.updateStatus(job.id, 'scheduled');
      await service.updateStatus(job.id, 'in_progress');
      await service.updateStatus(job.id, 'completed');

      await expect(
        service.updateStatus(job.id, 'pending'),
      ).rejects.toThrow(InvalidStateTransitionError);
    });
  });

  describe('assignTechnician', () => {
    it('assigns a technician to a job', async () => {
      const job = await service.create(makeJobInput());
      const technicianId = '00000000-0000-0000-0000-000000000001';
      const assignment = await service.assignTechnician(job.id, technicianId);

      expect(assignment).toBeDefined();
      expect(assignment.jobId).toBe(job.id);
      expect(assignment.technicianId).toBe(technicianId);
    });

    it('retrieves assignments for a job', async () => {
      const job = await service.create(makeJobInput());
      const techId = '00000000-0000-0000-0000-000000000001';
      await service.assignTechnician(job.id, techId);

      const assignments = await service.getAssignments(job.id);
      expect(assignments).toHaveLength(1);
      expect(assignments[0].technicianId).toBe(techId);
    });
  });
});
