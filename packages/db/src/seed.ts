import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { randomUUID } from 'crypto';
import * as schema from './schema/index.js';

async function seed() {
  const url = process.env.DATABASE_URL || 'postgresql://openfsm:openfsm@localhost:5432/openfsm';
  const client = postgres(url);
  const db = drizzle(client, { schema });

  console.log('Seeding Cool Blasters HVAC data...');

  // Pre-generated UUIDs for referential integrity
  const ids = {
    owner: randomUUID(),
    techMaria: randomUUID(),
    techDerek: randomUUID(),
    techSam: randomUUID(),
    admin: randomUUID(),
    taxRate: randomUUID(),
    customers: Array.from({ length: 10 }, () => randomUUID()),
    locations: Array.from({ length: 10 }, () => randomUUID()),
    catalogItems: Array.from({ length: 6 }, () => randomUUID()),
    jobs: Array.from({ length: 15 }, () => randomUUID()),
    estimates: Array.from({ length: 5 }, () => randomUUID()),
    invoices: Array.from({ length: 8 }, () => randomUUID()),
    payments: Array.from({ length: 6 }, () => randomUUID()),
  };

  // Argon2 hash for "password123" — pre-computed for seed speed
  const passwordHash = '$argon2id$v=19$m=65536,t=3,p=4$c2VlZHNhbHQxMjM0NTY$YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY';

  // ── Company Settings ──
  await db.insert(schema.companySettings).values({
    companyName: 'Cool Blasters HVAC',
    tagline: 'Keeping LA Cool Since 2018',
    phone: '(323) 555-2583',
    email: 'info@coolblasters.com',
    website: 'https://coolblasters.com',
    address1: '1234 Sunset Blvd',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90026',
    timezone: 'America/Los_Angeles',
    invoicePrefix: 'CB-INV-',
    estimatePrefix: 'CB-EST-',
    nextInvoiceNumber: '1009',
    nextEstimateNumber: '1006',
    defaultPaymentTermsDays: '30',
  });

  // ── Site Config ──
  await db.insert(schema.siteConfig).values({
    heroTitle: 'Cool Blasters HVAC',
    heroSubtitle: 'Professional heating and air conditioning services for all of Los Angeles. Fast, reliable, and affordable.',
    aboutText: 'Cool Blasters has been serving the greater Los Angeles area since 2018. Our certified technicians handle everything from emergency AC repairs to full system installations. We pride ourselves on honest pricing, quality workmanship, and keeping your home comfortable year-round.',
    serviceAreaDescription: 'We serve all of Los Angeles County including Hollywood, Silver Lake, Echo Park, Downtown LA, Pasadena, Glendale, Burbank, Santa Monica, and the San Fernando Valley.',
    businessHours: JSON.stringify({
      monday: { open: '07:00', close: '18:00' },
      tuesday: { open: '07:00', close: '18:00' },
      wednesday: { open: '07:00', close: '18:00' },
      thursday: { open: '07:00', close: '18:00' },
      friday: { open: '07:00', close: '18:00' },
      saturday: { open: '08:00', close: '14:00' },
      sunday: { open: 'closed', close: 'closed' },
    }),
    metaTitle: 'Cool Blasters HVAC — Los Angeles AC Repair & Installation',
    metaDescription: 'Professional HVAC services in Los Angeles. AC repair, installation, furnace repair, and duct cleaning. Licensed and insured. Call (323) 555-2583.',
    isPublished: new Date(),
  });

  // ── Users ──
  await db.insert(schema.users).values([
    {
      id: ids.owner,
      email: 'jake@coolblasters.com',
      passwordHash,
      firstName: 'Jake',
      lastName: 'Frost',
      phone: '(323) 555-2583',
      role: 'owner',
    },
    {
      id: ids.admin,
      email: 'office@coolblasters.com',
      passwordHash,
      firstName: 'Lisa',
      lastName: 'Chen',
      phone: '(323) 555-2584',
      role: 'admin',
    },
    {
      id: ids.techMaria,
      email: 'maria@coolblasters.com',
      passwordHash,
      firstName: 'Maria',
      lastName: 'Torres',
      phone: '(323) 555-2585',
      role: 'technician',
    },
    {
      id: ids.techDerek,
      email: 'derek@coolblasters.com',
      passwordHash,
      firstName: 'Derek',
      lastName: 'Kim',
      phone: '(323) 555-2586',
      role: 'technician',
    },
    {
      id: ids.techSam,
      email: 'sam@coolblasters.com',
      passwordHash,
      firstName: 'Sam',
      lastName: 'Okafor',
      phone: '(323) 555-2587',
      role: 'technician',
    },
  ]);

  // ── Tax Rate ──
  await db.insert(schema.taxRates).values({
    id: ids.taxRate,
    name: 'LA County Sales Tax',
    rate: '0.0950',
    isDefault: true,
  });

  // ── Catalog Items ──
  const catalogData = [
    { id: ids.catalogItems[0], name: 'AC Repair', description: 'Diagnose and repair air conditioning systems', type: 'service' as const, unitPrice: '150.00', unit: 'visit' },
    { id: ids.catalogItems[1], name: 'AC Installation', description: 'Full air conditioning system installation', type: 'service' as const, unitPrice: '3500.00', unit: 'project' },
    { id: ids.catalogItems[2], name: 'Furnace Repair', description: 'Diagnose and repair heating/furnace systems', type: 'service' as const, unitPrice: '175.00', unit: 'visit' },
    { id: ids.catalogItems[3], name: 'Duct Cleaning', description: 'Full HVAC duct cleaning and sanitization', type: 'service' as const, unitPrice: '350.00', unit: 'project' },
    { id: ids.catalogItems[4], name: 'Maintenance Tune-Up', description: 'Seasonal HVAC maintenance and inspection', type: 'service' as const, unitPrice: '89.00', unit: 'visit' },
    { id: ids.catalogItems[5], name: 'Emergency Service', description: '24/7 emergency HVAC service call', type: 'service' as const, unitPrice: '250.00', unit: 'visit' },
  ];
  await db.insert(schema.catalogItems).values(catalogData);

  // ── Customers ──
  const customerData = [
    { id: ids.customers[0], firstName: 'Robert', lastName: 'Garcia', email: 'rgarcia@email.com', phone: '(213) 555-0101' },
    { id: ids.customers[1], firstName: 'Jennifer', lastName: 'Park', email: 'jpark@email.com', phone: '(310) 555-0102' },
    { id: ids.customers[2], firstName: 'Michael', lastName: 'Thompson', email: 'mthompson@email.com', phone: '(818) 555-0103' },
    { id: ids.customers[3], firstName: 'Sarah', lastName: 'Williams', email: 'swilliams@email.com', phone: '(323) 555-0104' },
    { id: ids.customers[4], firstName: 'David', lastName: 'Nguyen', email: 'dnguyen@email.com', phone: '(626) 555-0105' },
    { id: ids.customers[5], firstName: 'Amanda', lastName: 'Rodriguez', email: 'arodriguez@email.com', phone: '(213) 555-0106' },
    { id: ids.customers[6], firstName: 'James', lastName: 'Lee', email: 'jlee@email.com', phone: '(310) 555-0107' },
    { id: ids.customers[7], firstName: 'Emily', lastName: 'Brown', email: 'ebrown@email.com', phone: '(818) 555-0108' },
    { id: ids.customers[8], companyName: 'Sunset Dental Group', firstName: 'Frank', lastName: 'Martinez', email: 'fmartinez@sunsetdental.com', phone: '(323) 555-0109' },
    { id: ids.customers[9], companyName: 'Silver Lake Coffee', firstName: 'Amy', lastName: 'Chen', email: 'achen@silverlakecoffee.com', phone: '(213) 555-0110' },
  ];
  await db.insert(schema.customers).values(customerData);

  // ── Locations ──
  const locationData = [
    { id: ids.locations[0], customerId: ids.customers[0], name: 'Home', address1: '456 N Broadway', city: 'Los Angeles', state: 'CA', zip: '90012' },
    { id: ids.locations[1], customerId: ids.customers[1], name: 'Home', address1: '789 Ocean Ave', city: 'Santa Monica', state: 'CA', zip: '90401' },
    { id: ids.locations[2], customerId: ids.customers[2], name: 'Home', address1: '321 Ventura Blvd', city: 'Sherman Oaks', state: 'CA', zip: '91403' },
    { id: ids.locations[3], customerId: ids.customers[3], name: 'Home', address1: '555 Melrose Ave', city: 'Los Angeles', state: 'CA', zip: '90038' },
    { id: ids.locations[4], customerId: ids.customers[4], name: 'Home', address1: '888 Colorado Blvd', city: 'Pasadena', state: 'CA', zip: '91101' },
    { id: ids.locations[5], customerId: ids.customers[5], name: 'Home', address1: '222 Figueroa St', city: 'Los Angeles', state: 'CA', zip: '90012' },
    { id: ids.locations[6], customerId: ids.customers[6], name: 'Home', address1: '444 Wilshire Blvd', city: 'Beverly Hills', state: 'CA', zip: '90210' },
    { id: ids.locations[7], customerId: ids.customers[7], name: 'Home', address1: '666 Riverside Dr', city: 'Burbank', state: 'CA', zip: '91506' },
    { id: ids.locations[8], customerId: ids.customers[8], name: 'Office', address1: '999 Sunset Blvd', city: 'Los Angeles', state: 'CA', zip: '90028' },
    { id: ids.locations[9], customerId: ids.customers[9], name: 'Cafe', address1: '111 Silver Lake Blvd', city: 'Los Angeles', state: 'CA', zip: '90026' },
  ];
  await db.insert(schema.locations).values(locationData);

  // ── Tags ──
  const tagIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  await db.insert(schema.tags).values([
    { id: tagIds[0], name: 'VIP', color: '#FFD700' },
    { id: tagIds[1], name: 'Commercial', color: '#4169E1' },
    { id: tagIds[2], name: 'Residential', color: '#32CD32' },
    { id: tagIds[3], name: 'Recurring', color: '#9370DB' },
  ]);

  // ── Jobs ──
  const now = new Date();
  const day = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    return date;
  };
  const techs = [ids.techMaria, ids.techDerek, ids.techSam];

  const jobData = [
    { id: ids.jobs[0], number: 1001, customerId: ids.customers[0], locationId: ids.locations[0], title: 'AC not cooling', description: 'Unit runs but blows warm air', status: 'completed' as const, priority: 'high' as const, scheduledStart: day(-10), scheduledEnd: day(-10), actualStart: day(-10), actualEnd: day(-10) },
    { id: ids.jobs[1], number: 1002, customerId: ids.customers[1], locationId: ids.locations[1], title: 'Annual maintenance', description: 'Yearly tune-up for central AC', status: 'completed' as const, priority: 'normal' as const, scheduledStart: day(-8), scheduledEnd: day(-8), actualStart: day(-8), actualEnd: day(-8) },
    { id: ids.jobs[2], number: 1003, customerId: ids.customers[2], locationId: ids.locations[2], title: 'Furnace making noise', description: 'Rattling sound when furnace kicks on', status: 'completed' as const, priority: 'normal' as const, scheduledStart: day(-7), scheduledEnd: day(-7), actualStart: day(-7), actualEnd: day(-7) },
    { id: ids.jobs[3], number: 1004, customerId: ids.customers[3], locationId: ids.locations[3], title: 'New AC install consultation', description: 'Customer wants quote for new 3-ton unit', status: 'completed' as const, priority: 'normal' as const, scheduledStart: day(-6), scheduledEnd: day(-6), actualStart: day(-6), actualEnd: day(-6) },
    { id: ids.jobs[4], number: 1005, customerId: ids.customers[4], locationId: ids.locations[4], title: 'Duct cleaning', description: 'Full house duct cleaning', status: 'completed' as const, priority: 'low' as const, scheduledStart: day(-5), scheduledEnd: day(-5), actualStart: day(-5), actualEnd: day(-5) },
    { id: ids.jobs[5], number: 1006, customerId: ids.customers[5], locationId: ids.locations[5], title: 'Thermostat replacement', description: 'Upgrade to smart thermostat', status: 'completed' as const, priority: 'normal' as const, scheduledStart: day(-4), scheduledEnd: day(-4), actualStart: day(-4), actualEnd: day(-4) },
    { id: ids.jobs[6], number: 1007, customerId: ids.customers[8], locationId: ids.locations[8], title: 'Commercial AC maintenance', description: 'Quarterly maintenance for dental office', status: 'completed' as const, priority: 'normal' as const, scheduledStart: day(-3), scheduledEnd: day(-3), actualStart: day(-3), actualEnd: day(-3) },
    { id: ids.jobs[7], number: 1008, customerId: ids.customers[6], locationId: ids.locations[6], title: 'Refrigerant recharge', description: 'AC low on refrigerant', status: 'in_progress' as const, priority: 'high' as const, scheduledStart: day(0), scheduledEnd: day(0), actualStart: day(0) },
    { id: ids.jobs[8], number: 1009, customerId: ids.customers[7], locationId: ids.locations[7], title: 'Furnace inspection', description: 'Pre-winter furnace check', status: 'scheduled' as const, priority: 'normal' as const, scheduledStart: day(1), scheduledEnd: day(1) },
    { id: ids.jobs[9], number: 1010, customerId: ids.customers[9], locationId: ids.locations[9], title: 'AC not turning on', description: 'Commercial unit not powering up', status: 'scheduled' as const, priority: 'high' as const, scheduledStart: day(1), scheduledEnd: day(1) },
    { id: ids.jobs[10], number: 1011, customerId: ids.customers[0], locationId: ids.locations[0], title: 'Follow-up AC check', description: 'Post-repair follow-up visit', status: 'scheduled' as const, priority: 'low' as const, scheduledStart: day(2), scheduledEnd: day(2) },
    { id: ids.jobs[11], number: 1012, customerId: ids.customers[3], locationId: ids.locations[3], title: 'New AC installation', description: 'Install 3-ton Carrier unit', status: 'scheduled' as const, priority: 'normal' as const, scheduledStart: day(3), scheduledEnd: day(4) },
    { id: ids.jobs[12], number: 1013, customerId: ids.customers[1], locationId: ids.locations[1], title: 'Duct leak repair', description: 'Air leak in attic ductwork', status: 'pending' as const, priority: 'normal' as const },
    { id: ids.jobs[13], number: 1014, customerId: ids.customers[5], locationId: ids.locations[5], title: 'AC tune-up', description: 'Seasonal maintenance', status: 'pending' as const, priority: 'low' as const },
    { id: ids.jobs[14], number: 1015, customerId: ids.customers[2], locationId: ids.locations[2], title: 'Emergency - no heat', description: 'Furnace stopped working completely', status: 'cancelled' as const, priority: 'emergency' as const },
  ];
  await db.insert(schema.jobs).values(jobData);

  // ── Job Assignments ──
  const assignmentData = jobData.slice(0, 12).map((job, i) => ({
    jobId: job.id,
    technicianId: techs[i % 3],
  }));
  await db.insert(schema.jobAssignments).values(assignmentData);

  // ── Estimates ──
  await db.insert(schema.estimates).values([
    { id: ids.estimates[0], number: 'CB-EST-1001', customerId: ids.customers[3], locationId: ids.locations[3], jobId: ids.jobs[3], status: 'approved', subtotal: '4200.00', taxAmount: '399.00', total: '4599.00', approvedAt: day(-5) },
    { id: ids.estimates[1], number: 'CB-EST-1002', customerId: ids.customers[1], locationId: ids.locations[1], status: 'sent', subtotal: '450.00', taxAmount: '42.75', total: '492.75', sentAt: day(-2) },
    { id: ids.estimates[2], number: 'CB-EST-1003', customerId: ids.customers[7], locationId: ids.locations[7], status: 'draft', subtotal: '89.00', taxAmount: '8.46', total: '97.46' },
    { id: ids.estimates[3], number: 'CB-EST-1004', customerId: ids.customers[9], locationId: ids.locations[9], status: 'sent', subtotal: '1200.00', taxAmount: '114.00', total: '1314.00', sentAt: day(-1) },
    { id: ids.estimates[4], number: 'CB-EST-1005', customerId: ids.customers[4], locationId: ids.locations[4], status: 'declined', subtotal: '5800.00', taxAmount: '551.00', total: '6351.00', declinedAt: day(-3) },
  ]);

  // ── Estimate Line Items ──
  await db.insert(schema.estimateLineItems).values([
    { estimateId: ids.estimates[0], catalogItemId: ids.catalogItems[1], description: 'AC Installation - 3-ton Carrier unit', quantity: '1', unitPrice: '3500.00', taxRateId: ids.taxRate, sortOrder: 0 },
    { estimateId: ids.estimates[0], description: 'Copper line set and fittings', quantity: '1', unitPrice: '450.00', taxRateId: ids.taxRate, sortOrder: 1 },
    { estimateId: ids.estimates[0], description: 'Thermostat upgrade', quantity: '1', unitPrice: '250.00', taxRateId: ids.taxRate, sortOrder: 2 },
    { estimateId: ids.estimates[1], catalogItemId: ids.catalogItems[3], description: 'Duct Cleaning', quantity: '1', unitPrice: '350.00', taxRateId: ids.taxRate, sortOrder: 0 },
    { estimateId: ids.estimates[1], description: 'Duct sealant application', quantity: '1', unitPrice: '100.00', taxRateId: ids.taxRate, sortOrder: 1 },
    { estimateId: ids.estimates[2], catalogItemId: ids.catalogItems[4], description: 'Maintenance Tune-Up', quantity: '1', unitPrice: '89.00', taxRateId: ids.taxRate, sortOrder: 0 },
    { estimateId: ids.estimates[3], description: 'Commercial AC diagnostic and repair', quantity: '1', unitPrice: '1200.00', taxRateId: ids.taxRate, sortOrder: 0 },
    { estimateId: ids.estimates[4], catalogItemId: ids.catalogItems[1], description: 'Full HVAC system replacement', quantity: '1', unitPrice: '5800.00', taxRateId: ids.taxRate, sortOrder: 0 },
  ]);

  // ── Invoices ──
  await db.insert(schema.invoices).values([
    { id: ids.invoices[0], number: 'CB-INV-1001', customerId: ids.customers[0], jobId: ids.jobs[0], status: 'paid', subtotal: '150.00', taxAmount: '14.25', total: '164.25', amountPaid: '164.25', balanceDue: '0', dueDate: day(-5), sentAt: day(-9), paidAt: day(-7) },
    { id: ids.invoices[1], number: 'CB-INV-1002', customerId: ids.customers[1], jobId: ids.jobs[1], status: 'paid', subtotal: '89.00', taxAmount: '8.46', total: '97.46', amountPaid: '97.46', balanceDue: '0', dueDate: day(-3), sentAt: day(-7), paidAt: day(-5) },
    { id: ids.invoices[2], number: 'CB-INV-1003', customerId: ids.customers[2], jobId: ids.jobs[2], status: 'paid', subtotal: '175.00', taxAmount: '16.63', total: '191.63', amountPaid: '191.63', balanceDue: '0', dueDate: day(0), sentAt: day(-6), paidAt: day(-4) },
    { id: ids.invoices[3], number: 'CB-INV-1004', customerId: ids.customers[4], jobId: ids.jobs[4], status: 'paid', subtotal: '350.00', taxAmount: '33.25', total: '383.25', amountPaid: '383.25', balanceDue: '0', dueDate: day(2), sentAt: day(-4), paidAt: day(-2) },
    { id: ids.invoices[4], number: 'CB-INV-1005', customerId: ids.customers[5], jobId: ids.jobs[5], status: 'sent', subtotal: '285.00', taxAmount: '27.08', total: '312.08', amountPaid: '0', balanceDue: '312.08', dueDate: day(5), sentAt: day(-3) },
    { id: ids.invoices[5], number: 'CB-INV-1006', customerId: ids.customers[8], jobId: ids.jobs[6], status: 'sent', subtotal: '450.00', taxAmount: '42.75', total: '492.75', amountPaid: '0', balanceDue: '492.75', dueDate: day(10), sentAt: day(-2) },
    { id: ids.invoices[6], number: 'CB-INV-1007', customerId: ids.customers[3], estimateId: ids.estimates[0], jobId: ids.jobs[3], status: 'overdue', subtotal: '4200.00', taxAmount: '399.00', total: '4599.00', amountPaid: '2000.00', balanceDue: '2599.00', dueDate: day(-2), sentAt: day(-5) },
    { id: ids.invoices[7], number: 'CB-INV-1008', customerId: ids.customers[6], jobId: ids.jobs[7], status: 'draft', subtotal: '150.00', taxAmount: '14.25', total: '164.25', amountPaid: '0', balanceDue: '164.25', dueDate: day(15) },
  ]);

  // ── Payments ──
  await db.insert(schema.payments).values([
    { id: ids.payments[0], invoiceId: ids.invoices[0], customerId: ids.customers[0], amount: '164.25', method: 'credit_card', status: 'completed', processedAt: day(-7) },
    { id: ids.payments[1], invoiceId: ids.invoices[1], customerId: ids.customers[1], amount: '97.46', method: 'zelle', status: 'completed', reference: 'Zelle from jpark@email.com', processedAt: day(-5) },
    { id: ids.payments[2], invoiceId: ids.invoices[2], customerId: ids.customers[2], amount: '191.63', method: 'check', status: 'completed', reference: 'Check #4521', processedAt: day(-4) },
    { id: ids.payments[3], invoiceId: ids.invoices[3], customerId: ids.customers[4], amount: '383.25', method: 'cash', status: 'completed', processedAt: day(-2) },
    { id: ids.payments[4], invoiceId: ids.invoices[6], customerId: ids.customers[3], amount: '2000.00', method: 'bank_transfer', status: 'completed', reference: 'ACH partial payment', processedAt: day(-3) },
    { id: ids.payments[5], invoiceId: ids.invoices[6], customerId: ids.customers[3], amount: '500.00', method: 'zelle', status: 'pending', reference: 'Zelle pending', processedAt: day(-1) },
  ]);

  // ── Booking Requests ──
  await db.insert(schema.bookingRequests).values([
    { customerName: 'Patricia Vega', customerEmail: 'pvega@email.com', customerPhone: '(213) 555-0201', serviceRequested: 'AC Repair', preferredDate: day(3), preferredTimeSlot: 'morning', description: 'AC making clicking noise', address: '777 Temple St, Los Angeles, CA 90012', status: 'pending' },
    { customerName: 'Kevin Wright', customerEmail: 'kwright@email.com', customerPhone: '(310) 555-0202', serviceRequested: 'Maintenance Tune-Up', preferredDate: day(5), preferredTimeSlot: 'afternoon', description: 'Annual checkup before summer', address: '333 Main St, Santa Monica, CA 90405', status: 'confirmed', confirmedAt: day(0), customerId: ids.customers[7] },
  ]);

  // ── Messages ──
  await db.insert(schema.messages).values([
    { customerId: ids.customers[3], isFromCustomer: true, content: 'Hi, when can I expect the installation to be scheduled? I approved the estimate last week.' },
    { customerId: ids.customers[3], staffUserId: ids.admin, isFromCustomer: false, content: 'Hi Sarah! We have you scheduled for next Tuesday. Maria will be your technician. She\'ll arrive between 8-9 AM.' },
    { customerId: ids.customers[3], isFromCustomer: true, content: 'Perfect, thank you!' },
    { customerId: ids.customers[8], isFromCustomer: true, content: 'Can we schedule the next quarterly maintenance? Our office is available any weekday morning.' },
    { customerId: ids.customers[5], isFromCustomer: true, content: 'I just received the invoice. Can I pay via Zelle?', readAt: new Date() },
    { customerId: ids.customers[5], staffUserId: ids.owner, isFromCustomer: false, content: 'Absolutely! You can send Zelle to payments@coolblasters.com. Please use your invoice number CB-INV-1005 as the memo.' },
  ]);

  // ── Customer Auth (for portal access) ──
  await db.insert(schema.customerAuth).values([
    { customerId: ids.customers[0], email: 'rgarcia@email.com' },
    { customerId: ids.customers[1], email: 'jpark@email.com' },
    { customerId: ids.customers[3], email: 'swilliams@email.com' },
    { customerId: ids.customers[8], email: 'fmartinez@sunsetdental.com' },
  ]);

  // ── Audit Log ──
  await db.insert(schema.auditLog).values([
    { userId: ids.owner, action: 'invoice.sent', entityType: 'invoice', entityId: ids.invoices[0], changes: { status: { from: 'draft', to: 'sent' } } },
    { userId: ids.owner, action: 'payment.recorded', entityType: 'payment', entityId: ids.payments[0], changes: { amount: '164.25', method: 'credit_card' } },
    { userId: ids.owner, action: 'estimate.approved', entityType: 'estimate', entityId: ids.estimates[0], changes: { status: { from: 'sent', to: 'approved' } } },
  ]);

  console.log('Seed complete! Cool Blasters HVAC data loaded.');
  console.log('');
  console.log('Login credentials:');
  console.log('  Owner:      jake@coolblasters.com / password123');
  console.log('  Admin:      office@coolblasters.com / password123');
  console.log('  Technician: maria@coolblasters.com / password123');
  console.log('  Technician: derek@coolblasters.com / password123');
  console.log('  Technician: sam@coolblasters.com / password123');

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
