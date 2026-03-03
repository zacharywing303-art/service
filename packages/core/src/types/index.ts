import { z } from 'zod';

// ── Pagination ──
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Auth ──
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  role: z.enum(['owner', 'admin', 'technician', 'accountant']).default('technician'),
});

// ── Customers ──
export const createCustomerSchema = z.object({
  companyName: z.string().max(255).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  source: z.string().max(100).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ── Locations ──
export const createLocationSchema = z.object({
  customerId: z.string().uuid(),
  name: z.string().max(255).optional(),
  address1: z.string().min(1).max(255),
  address2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(50),
  zip: z.string().min(1).max(20),
  notes: z.string().optional(),
});

// ── Jobs ──
export const createJobSchema = z.object({
  customerId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'emergency']).default('normal'),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  internalNotes: z.string().optional(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']),
});

// ── Catalog Items ──
export const createCatalogItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['service', 'part', 'material']).default('service'),
  unitPrice: z.string().regex(/^\d+\.\d{2}$/),
  unit: z.string().max(50).default('each'),
  taxable: z.boolean().default(true),
});

// ── Line Items (shared for estimates/invoices) ──
export const lineItemSchema = z.object({
  catalogItemId: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  quantity: z.string().regex(/^\d+(\.\d{1,2})?$/),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  taxRateId: z.string().uuid().optional(),
  sortOrder: z.number().int().default(0),
});

// ── Estimates ──
export const createEstimateSchema = z.object({
  customerId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  notes: z.string().optional(),
  customerMessage: z.string().optional(),
  validUntil: z.string().datetime().optional(),
  lineItems: z.array(lineItemSchema).min(1),
});

// ── Invoices ──
export const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  estimateId: z.string().uuid().optional(),
  notes: z.string().optional(),
  customerMessage: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  lineItems: z.array(lineItemSchema).min(1),
});

// ── Payments ──
export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  method: z.enum(['cash', 'check', 'credit_card', 'bank_transfer', 'zelle', 'stripe', 'other']),
  reference: z.string().max(255).optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().max(255).optional(),
});

// ── Booking ──
export const createBookingSchema = z.object({
  customerName: z.string().min(1).max(255),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(20).optional(),
  serviceRequested: z.string().min(1).max(255),
  preferredDate: z.string().datetime(),
  preferredTimeSlot: z.string().max(50).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
});

// ── Messages ──
export const sendMessageSchema = z.object({
  customerId: z.string().uuid(),
  content: z.string().min(1),
  isFromCustomer: z.boolean().default(false),
});

// ── Settings ──
export const updateSettingsSchema = z.object({
  companyName: z.string().max(255).optional(),
  tagline: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().max(255).optional(),
  address1: z.string().max(255).optional(),
  address2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  timezone: z.string().max(50).optional(),
  invoicePrefix: z.string().max(20).optional(),
  estimatePrefix: z.string().max(20).optional(),
  defaultPaymentTermsDays: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type CreateCatalogItemInput = z.infer<typeof createCatalogItemSchema>;
export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
