import { eq, and, isNull, sql, count, between, inArray } from 'drizzle-orm';
import { jobs, jobAssignments, jobTimeEntries, jobMaterials } from '@openfsm/db';
import type { Database } from '@openfsm/db';
import { NotFoundError, InvalidStateTransitionError } from '../errors/index.js';
import type { CreateJobInput, PaginationParams, PaginatedResult } from '../types/index.js';
import { getOffset, paginate } from '../utils/pagination.js';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: ['pending'],
};

export class JobService {
  constructor(private db: Database) {}

  async list(params: PaginationParams, filters?: { status?: string; technicianId?: string }): Promise<PaginatedResult<typeof jobs.$inferSelect>> {
    const conditions = [isNull(jobs.deletedAt)];
    if (filters?.status) {
      conditions.push(eq(jobs.status, filters.status as any));
    }

    const where = and(...conditions);
    const [{ value: total }] = await this.db.select({ value: count() }).from(jobs).where(where);
    const data = await this.db.select().from(jobs).where(where)
      .limit(params.limit)
      .offset(getOffset(params))
      .orderBy(sql`${jobs.createdAt} DESC`);

    return paginate(data, total, params);
  }

  async getById(id: string) {
    const [job] = await this.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) throw new NotFoundError('Job', id);
    return job;
  }

  async create(input: CreateJobInput) {
    // Get next job number
    const [result] = await this.db.select({ maxNum: sql<number>`COALESCE(MAX(${jobs.number}), 1000)` }).from(jobs);
    const nextNumber = (result?.maxNum ?? 1000) + 1;

    const [job] = await this.db.insert(jobs).values({
      ...input,
      number: nextNumber,
      scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : undefined,
      scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : undefined,
    }).returning();
    return job;
  }

  async updateStatus(id: string, newStatus: string) {
    const job = await this.getById(id);
    const allowed = VALID_TRANSITIONS[job.status];
    if (!allowed?.includes(newStatus)) {
      throw new InvalidStateTransitionError('Job', job.status, newStatus);
    }

    const updates: Record<string, any> = { status: newStatus, updatedAt: new Date() };
    if (newStatus === 'in_progress') updates.actualStart = new Date();
    if (newStatus === 'completed') updates.actualEnd = new Date();

    const [updated] = await this.db.update(jobs).set(updates).where(eq(jobs.id, id)).returning();
    return updated;
  }

  async assignTechnician(jobId: string, technicianId: string) {
    const [assignment] = await this.db.insert(jobAssignments).values({ jobId, technicianId }).returning();
    return assignment;
  }

  async getAssignments(jobId: string) {
    return this.db.select().from(jobAssignments).where(eq(jobAssignments.jobId, jobId));
  }

  async startTimer(jobId: string, technicianId: string) {
    const [entry] = await this.db.insert(jobTimeEntries).values({
      jobId,
      technicianId,
      startTime: new Date(),
    }).returning();
    return entry;
  }

  async stopTimer(entryId: string) {
    const endTime = new Date();
    const [entry] = await this.db.select().from(jobTimeEntries).where(eq(jobTimeEntries.id, entryId)).limit(1);
    if (!entry) throw new NotFoundError('TimeEntry', entryId);

    const durationMinutes = Math.round((endTime.getTime() - entry.startTime.getTime()) / 60000);
    const [updated] = await this.db.update(jobTimeEntries)
      .set({ endTime, durationMinutes })
      .where(eq(jobTimeEntries.id, entryId))
      .returning();
    return updated;
  }

  async addMaterial(jobId: string, input: { catalogItemId?: string; description: string; quantity: string; unitPrice: string }) {
    const [material] = await this.db.insert(jobMaterials).values({ jobId, ...input }).returning();
    return material;
  }

  async getJobsByDateRange(start: Date, end: Date) {
    return this.db.select().from(jobs)
      .where(and(
        isNull(jobs.deletedAt),
        between(jobs.scheduledStart, start, end),
      ))
      .orderBy(sql`${jobs.scheduledStart} ASC`);
  }
}
