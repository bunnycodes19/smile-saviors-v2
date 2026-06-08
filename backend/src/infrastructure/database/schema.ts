import { pgTable, uuid, varchar, timestamp, text, integer, numeric, jsonb, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. Tenants table (multi-tenant workspace isolation)
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  subdomain: varchar('subdomain', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Users table (clinic staff: ADMIN, DENTIST, RECEPTIONIST)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'ADMIN' | 'DENTIST' | 'RECEPTIONIST'
  phone: varchar('phone', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Patients table (patient records)
export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  dob: date('dob').notNull(),
  gender: varchar('gender', { length: 20 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  medicalHistory: jsonb('medical_history').default([]).notNull(), // array of strings
  allergies: jsonb('allergies').default([]).notNull(), // array of strings
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Appointments table (scheduling)
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  dentistId: uuid('dentist_id').references(() => users.id).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: varchar('status', { length: 50 }).default('SCHEDULED').notNull(), // 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  reason: varchar('reason', { length: 255 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. Treatments table (medical log and tooth chart notes)
export const treatments = pgTable('treatments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  dentistId: uuid('dentist_id').references(() => users.id).notNull(),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  toothNumber: integer('tooth_number'), // 1-32 or null for general (like cleaning)
  procedureName: varchar('procedure_name', { length: 255 }).notNull(), // e.g. Root Canal, Extraction, Teeth Whitening
  notes: text('notes'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('COMPLETED').notNull(), // 'PLANNED' | 'COMPLETED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. Invoices table (billing invoices)
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  status: varchar('status', { length: 50 }).default('UNPAID').notNull(), // 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'
  dueDate: date('due_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 7. Invoice Items table
export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  treatmentId: uuid('treatment_id').references(() => treatments.id, { onDelete: 'set null' }),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
