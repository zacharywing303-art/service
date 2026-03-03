import { eq, and, between, sql } from 'drizzle-orm';
import { scheduleEvents, jobs, jobAssignments } from '@openfsm/db';
import type { Database } from '@openfsm/db';
import { NotFoundError } from '../errors/index.js';

export class SchedulingService {
  constructor(private db: Database) {}

  async getEvents(start: Date, end: Date, technicianId?: string) {
    const conditions = [between(scheduleEvents.startTime, start, end)];
    if (technicianId) {
      conditions.push(eq(scheduleEvents.technicianId, technicianId));
    }
    return this.db.select().from(scheduleEvents)
      .where(and(...conditions))
      .orderBy(sql`${scheduleEvents.startTime} ASC`);
  }

  async createEvent(input: {
    technicianId: string;
    jobId?: string;
    customerId?: string;
    type: 'job' | 'time_off' | 'meeting' | 'other';
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
  }) {
    const [event] = await this.db.insert(scheduleEvents).values(input).returning();
    return event;
  }

  async updateEvent(id: string, input: Partial<{ startTime: Date; endTime: Date; title: string; description: string }>) {
    const [event] = await this.db.update(scheduleEvents)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(scheduleEvents.id, id))
      .returning();
    if (!event) throw new NotFoundError('ScheduleEvent', id);
    return event;
  }

  async deleteEvent(id: string) {
    const [event] = await this.db.delete(scheduleEvents).where(eq(scheduleEvents.id, id)).returning();
    if (!event) throw new NotFoundError('ScheduleEvent', id);
    return event;
  }

  async getAvailableSlots(technicianId: string, date: Date): Promise<{ start: string; end: string }[]> {
    const dayStart = new Date(date);
    dayStart.setHours(7, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0);

    const events = await this.getEvents(dayStart, dayEnd, technicianId);

    // Simple slot calculation: 1-hour slots, excluding booked times
    const slots: { start: string; end: string }[] = [];
    for (let hour = 7; hour < 18; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      const conflict = events.some(
        (e) => e.startTime < slotEnd && e.endTime > slotStart,
      );
      if (!conflict) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }
    return slots;
  }

  async reschedule(eventId: string, newStart: Date, newEnd: Date) {
    return this.updateEvent(eventId, { startTime: newStart, endTime: newEnd });
  }
}
