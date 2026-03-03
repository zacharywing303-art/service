import { sql, eq, and, gte, lte, count } from 'drizzle-orm';
import { invoices, jobs, estimates, payments } from '@openfsm/db';
import type { Database } from '@openfsm/db';

export class ReportingService {
  constructor(private db: Database) {}

  async getDashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    // Outstanding invoices
    const [outstanding] = await this.db.select({
      count: count(),
      total: sql<string>`COALESCE(SUM(${invoices.balanceDue}::numeric), 0)::text`,
    }).from(invoices).where(
      sql`${invoices.status} IN ('sent', 'partial', 'overdue')`,
    );

    // Revenue this month
    const [revenue] = await this.db.select({
      total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)::text`,
    }).from(payments).where(
      and(
        eq(payments.status, 'completed'),
        gte(payments.processedAt, monthStart),
      ),
    );

    // Jobs today
    const [jobsToday] = await this.db.select({ count: count() }).from(jobs).where(
      and(
        gte(jobs.scheduledStart, todayStart),
        lte(jobs.scheduledStart, new Date(todayStart.getTime() + 86400000)),
      ),
    );

    // Jobs this week
    const [jobsWeek] = await this.db.select({ count: count() }).from(jobs).where(
      and(
        gte(jobs.scheduledStart, weekStart),
        lte(jobs.scheduledStart, new Date(weekStart.getTime() + 7 * 86400000)),
      ),
    );

    // Estimate approval rate (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const [estStats] = await this.db.select({
      total: count(),
      approved: sql<number>`COUNT(*) FILTER (WHERE ${estimates.status} = 'approved' OR ${estimates.status} = 'converted')`,
    }).from(estimates).where(gte(estimates.createdAt, thirtyDaysAgo));

    return {
      outstandingInvoices: {
        count: outstanding.count,
        total: outstanding.total,
      },
      revenueThisMonth: revenue.total,
      jobsToday: jobsToday.count,
      jobsThisWeek: jobsWeek.count,
      estimateApprovalRate: estStats.total > 0
        ? Math.round((Number(estStats.approved) / estStats.total) * 100)
        : 0,
    };
  }
}
