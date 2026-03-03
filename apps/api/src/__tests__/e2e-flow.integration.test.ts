import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cleanupTestDb, closeTestDb, getTestDb, seedTestUser, seedTestCustomer } from '@openfsm/db/test-utils';
import { CustomerService, JobService, EstimateService, InvoiceService, PaymentService } from '@openfsm/core';

/**
 * E2E: Full Service Flow
 *
 * This test exercises the business logic layer directly (not HTTP endpoints)
 * to validate the complete lifecycle of a field service engagement:
 *
 *   Customer -> Job -> Schedule -> Work -> Complete
 *   Customer -> Estimate -> Approve -> Invoice -> Pay
 */
describe('E2E: Full Service Flow', () => {
  let db: ReturnType<typeof getTestDb>;
  let customerService: CustomerService;
  let jobService: JobService;
  let estimateService: EstimateService;
  let invoiceService: InvoiceService;
  let paymentService: PaymentService;

  // Shared state across the flow
  let customerId: string;
  let technicianId: string;
  let jobId: string;
  let estimateId: string;
  let invoiceId: string;

  beforeAll(async () => {
    await cleanupTestDb();
    db = getTestDb();
    customerService = new CustomerService(db);
    jobService = new JobService(db);
    estimateService = new EstimateService(db);
    invoiceService = new InvoiceService(db);
    paymentService = new PaymentService(db);

    // Seed a technician user for job assignments
    const user = await seedTestUser(db);
    technicianId = user.id;
  });

  afterAll(async () => {
    await cleanupTestDb();
    await closeTestDb();
  });

  // ── Step 1: Create customer ──

  it('1. creates a customer', async () => {
    const customer = await customerService.create({
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria@example.com',
      phone: '555-0300',
      companyName: 'Garcia Homes LLC',
    });

    expect(customer.id).toBeDefined();
    expect(customer.firstName).toBe('Maria');
    expect(customer.lastName).toBe('Garcia');
    expect(customer.companyName).toBe('Garcia Homes LLC');
    customerId = customer.id;
  });

  // ── Step 2: Create job for customer ──

  it('2. creates a job for the customer', async () => {
    const job = await jobService.create({
      customerId,
      title: 'HVAC System Installation',
      description: 'Install new central AC unit in main building',
      priority: 'high',
    });

    expect(job.id).toBeDefined();
    expect(job.customerId).toBe(customerId);
    expect(job.title).toBe('HVAC System Installation');
    expect(job.status).toBe('pending');
    expect(job.number).toBeGreaterThan(1000);
    jobId = job.id;
  });

  // ── Step 3: Schedule job (pending -> scheduled) ──

  it('3. schedules the job (pending -> scheduled)', async () => {
    const updated = await jobService.updateStatus(jobId, 'scheduled');

    expect(updated.status).toBe('scheduled');
    expect(updated.id).toBe(jobId);
  });

  // ── Step 4: Start job (scheduled -> in_progress) ──

  it('4. starts the job (scheduled -> in_progress)', async () => {
    const updated = await jobService.updateStatus(jobId, 'in_progress');

    expect(updated.status).toBe('in_progress');
    expect(updated.actualStart).toBeDefined();
  });

  // ── Step 5: Complete job (in_progress -> completed) ──

  it('5. completes the job (in_progress -> completed)', async () => {
    const updated = await jobService.updateStatus(jobId, 'completed');

    expect(updated.status).toBe('completed');
    expect(updated.actualEnd).toBeDefined();
  });

  // ── Step 6: Create estimate for customer ──

  it('6. creates an estimate for the customer', async () => {
    const estimate = await estimateService.create({
      customerId,
      jobId,
      notes: 'Estimate for HVAC installation',
      lineItems: [
        {
          description: 'Central AC Unit (3-ton)',
          quantity: '1',
          unitPrice: '2500.00',
          sortOrder: 0,
        },
        {
          description: 'Installation Labor (8 hours)',
          quantity: '8',
          unitPrice: '125.00',
          sortOrder: 1,
        },
        {
          description: 'Ductwork Materials',
          quantity: '1',
          unitPrice: '750.00',
          sortOrder: 2,
        },
      ],
    });

    expect(estimate.id).toBeDefined();
    expect(estimate.number).toBeDefined();
    expect(estimate.customerId).toBe(customerId);
    expect(estimate.status).toBe('draft');

    // Verify totals: subtotal = 2500 + (8*125) + 750 = 4250
    const subtotal = parseFloat(estimate.subtotal);
    expect(subtotal).toBe(4250);
    const total = parseFloat(estimate.total);
    expect(total).toBeGreaterThan(subtotal); // includes tax
    estimateId = estimate.id;
  });

  // ── Step 7: Send estimate (draft -> sent) ──

  it('7. sends the estimate (draft -> sent)', async () => {
    const updated = await estimateService.updateStatus(estimateId, 'sent');

    expect(updated.status).toBe('sent');
    expect(updated.sentAt).toBeDefined();
  });

  // ── Step 8: Accept estimate (sent -> approved) ──

  it('8. accepts the estimate (sent -> approved)', async () => {
    const updated = await estimateService.accept(estimateId, 'base64-signature-data');

    expect(updated.status).toBe('approved');
    expect(updated.approvedAt).toBeDefined();
  });

  // ── Step 9: Create invoice from estimate ──

  it('9. creates an invoice from the approved estimate', async () => {
    const invoice = await invoiceService.createFromEstimate(estimateId);

    expect(invoice.id).toBeDefined();
    expect(invoice.number).toBeDefined();
    expect(invoice.customerId).toBe(customerId);
    expect(invoice.estimateId).toBe(estimateId);
    expect(invoice.status).toBe('draft');

    // The invoice total should match the estimate total (recalculated)
    const invoiceTotal = parseFloat(invoice.total);
    expect(invoiceTotal).toBeGreaterThan(0);
    expect(parseFloat(invoice.balanceDue)).toBe(invoiceTotal);
    invoiceId = invoice.id;

    // Verify the estimate was marked as converted
    const estimate = await estimateService.getById(estimateId);
    expect(estimate.status).toBe('converted');
    expect(estimate.convertedInvoiceId).toBe(invoiceId);
  });

  // ── Step 10: Send invoice (draft -> sent) ──

  it('10. sends the invoice (draft -> sent)', async () => {
    const updated = await invoiceService.updateStatus(invoiceId, 'sent');

    expect(updated.status).toBe('sent');
    expect(updated.sentAt).toBeDefined();
  });

  // ── Step 11: Record payment ──

  it('11. records a full payment for the invoice', async () => {
    // Get the invoice to know the total
    const invoice = await invoiceService.getById(invoiceId);
    const totalDue = invoice.balanceDue;

    const payment = await paymentService.record({
      invoiceId,
      amount: totalDue,
      method: 'credit_card',
      reference: 'CC-TXN-12345',
      notes: 'Full payment received',
      idempotencyKey: 'test-payment-001',
    });

    expect(payment.id).toBeDefined();
    expect(payment.invoiceId).toBe(invoiceId);
    expect(payment.customerId).toBe(customerId);
    expect(payment.method).toBe('credit_card');
    expect(payment.status).toBe('completed');
    expect(parseFloat(payment.amount)).toBe(parseFloat(totalDue));
  });

  // ── Step 12: Verify invoice is paid ──

  it('12. verifies the invoice is fully paid', async () => {
    const invoice = await invoiceService.getById(invoiceId);

    expect(invoice.status).toBe('paid');
    expect(parseFloat(invoice.balanceDue)).toBe(0);
    expect(parseFloat(invoice.amountPaid)).toBe(parseFloat(invoice.total));
    expect(invoice.paidAt).toBeDefined();
  });

  // ── Bonus: Verify invalid state transitions are rejected ──

  it('rejects invalid job state transitions', async () => {
    // Completed job cannot transition to scheduled
    await expect(
      jobService.updateStatus(jobId, 'scheduled'),
    ).rejects.toThrow(/Invalid Job status transition/);
  });

  it('rejects invalid estimate state transitions', async () => {
    // Converted estimate cannot transition to sent
    await expect(
      estimateService.updateStatus(estimateId, 'sent'),
    ).rejects.toThrow(/Invalid Estimate status transition/);
  });

  it('rejects invalid invoice state transitions', async () => {
    // Paid invoice cannot transition to sent
    await expect(
      invoiceService.updateStatus(invoiceId, 'sent'),
    ).rejects.toThrow(/Invalid Invoice status transition/);
  });

  it('rejects duplicate payment via idempotency key', async () => {
    // The same idempotency key should return the original payment, not fail
    const invoice = await invoiceService.getById(invoiceId);

    // Since the invoice is already fully paid, balance is 0.
    // The idempotency check should return the existing payment before validation.
    const duplicate = await paymentService.record({
      invoiceId,
      amount: invoice.total,
      method: 'credit_card',
      idempotencyKey: 'test-payment-001',
    });

    // Should return the original payment (idempotent)
    expect(duplicate.id).toBeDefined();
    expect(duplicate.reference).toBe('CC-TXN-12345');
  });
});
