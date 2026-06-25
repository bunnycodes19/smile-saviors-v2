import { pgTable, uuid, varchar, timestamp, text, integer, numeric, jsonb, date, boolean } from 'drizzle-orm/pg-core';
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

// 5. Treatment Groups (Feature 8)
export const treatmentGroups = pgTable('treatment_groups', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  groupType: varchar('group_type', { length: 50 }).notNull(), // 'bridge' | 'denture' | 'ortho' | 'full_mouth_rehab'
  description: text('description'),
  totalCost: numeric('total_cost', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 30 }).default('proposed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Treatments table (medical log and tooth chart notes)
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
  status: varchar('status', { length: 50 }).default('COMPLETED').notNull(), // 'PROPOSED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // New clinical expansion columns
  chiefComplaint: text('chief_complaint'),
  symptoms: text('symptoms'),
  diagnosis: text('diagnosis'),
  followUpInstructions: text('follow_up_instructions'),
  clinicalNotes: text('clinical_notes'),
  estimatedCost: numeric('estimated_cost', { precision: 10, scale: 2 }),
  acceptedAt: timestamp('accepted_at'),
  completedAt: timestamp('completed_at'),
  treatmentGroupId: uuid('treatment_group_id').references(() => treatmentGroups.id, { onDelete: 'set null' }),
});

// 7. Invoices table (billing invoices)
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

// 8. Invoice Items table
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

// 9. Tooth Conditions table (Feature 1)
export const toothConditions = pgTable('tooth_conditions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  toothNumber: varchar('tooth_number', { length: 5 }).notNull(), // FDI notation "11"-"48" or Universal "1"-"32"
  surface: varchar('surface', { length: 10 }), // mesial | distal | occlusal | incisal | buccal | lingual
  conditionCode: varchar('condition_code', { length: 30 }).notNull(), // caries | filling | crown | missing | rct | fracture | extraction | implant | bridge | sealant | veneer | healthy
  status: varchar('status', { length: 20 }).default('completed').notNull(), // planned | completed
  dateRecorded: date('date_recorded').defaultNow().notNull(),
  visitId: uuid('visit_id').references(() => appointments.id, { onDelete: 'set null' }),
  dentistId: uuid('dentist_id').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 10. Radiographs table (Feature 2)
export const radiographs = pgTable('radiographs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  imageType: varchar('image_type', { length: 50 }).notNull(), // iopa | opg | bitewing | lateral_ceph | cbct | intraoral_photo | before_after
  imageUrl: text('image_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  toothNumbers: varchar('tooth_numbers', { length: 100 }), // comma-separated teeth (e.g. "26,27")
  takenDate: date('taken_date'),
  visitId: uuid('visit_id').references(() => appointments.id, { onDelete: 'set null' }),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Drug Templates (Feature 4)
export const drugTemplates = pgTable('drug_templates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // null means global default template
  name: varchar('name', { length: 255 }).notNull(),
  genericName: varchar('generic_name', { length: 255 }),
  category: varchar('category', { length: 100 }), // antibiotic | analgesic | anti_inflammatory | mouthwash | other
  defaultDosage: varchar('default_dosage', { length: 100 }),
  defaultFrequency: varchar('default_frequency', { length: 50 }), // "1-0-1", "BD", "TDS"
  defaultDuration: integer('default_duration'), // days
  defaultInstructions: text('default_instructions'),
  contraindications: jsonb('contraindications').default([]).notNull(), // array of strings (e.g. ["penicillin"])
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. Prescriptions (Feature 4)
export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  visitId: uuid('visit_id').references(() => appointments.id, { onDelete: 'set null' }),
  dentistId: uuid('dentist_id').references(() => users.id).notNull(),
  date: date('date').defaultNow().notNull(),
  pdfUrl: text('pdf_url'), // pdf file url on cloudinary or local
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. Prescription Items (Feature 4)
export const prescriptionItems = pgTable('prescription_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  prescriptionId: uuid('prescription_id').references(() => prescriptions.id, { onDelete: 'cascade' }).notNull(),
  drugName: varchar('drug_name', { length: 255 }).notNull(),
  dosage: varchar('dosage', { length: 100 }),
  frequency: varchar('frequency', { length: 50 }),
  durationDays: integer('duration_days'),
  instructions: text('instructions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. Recall Rules (Feature 6)
export const recallRules = pgTable('recall_rules', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  procedureType: varchar('procedure_type', { length: 255 }).notNull(), // e.g. Scaling, Implant, Extraction
  intervalDays: integer('interval_days').notNull(),
  recurring: boolean('recurring').default(false).notNull(),
  reminderText: text('reminder_text'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 15. Recall Schedules (Feature 6)
export const recallSchedules = pgTable('recall_schedules', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  toothNumber: varchar('tooth_number', { length: 5 }),
  sourceTreatmentId: uuid('source_treatment_id').references(() => treatments.id, { onDelete: 'set null' }),
  ruleId: uuid('rule_id').references(() => recallRules.id, { onDelete: 'set null' }),
  dueDate: date('due_date').notNull(),
  status: varchar('status', { length: 30 }).default('pending').notNull(), // pending | booked | completed | missed
  reminderSent: boolean('reminder_sent').default(false).notNull(),
  reminderSentAt: timestamp('reminder_sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 16. Reminders Log (Feature 6)
export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  recallId: uuid('recall_id').references(() => recallSchedules.id, { onDelete: 'set null' }),
  channel: varchar('channel', { length: 20 }).notNull(), // whatsapp | sms | email
  messageTemplate: text('message_template'),
  sentAt: timestamp('sent_at'),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending | sent | delivered | failed
  patientResponse: varchar('patient_response', { length: 50 }), // CONFIRM | CANCEL | RESCHEDULE
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 17. Consent Templates (Feature 7)
export const consentTemplates = pgTable('consent_templates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // null = system default
  procedureType: varchar('procedure_type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  legalText: text('legal_text').notNull(),
  requiresGuardian: boolean('requires_guardian').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 18. Consents signed (Feature 7)
export const consents = pgTable('consents', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  treatmentId: uuid('treatment_id').references(() => treatments.id, { onDelete: 'set null' }),
  templateId: uuid('template_id').references(() => consentTemplates.id).notNull(),
  signedImageUrl: text('signed_image_url').notNull(), // signature image URL on cloudinary or local
  signedAt: timestamp('signed_at').notNull(),
  signerName: varchar('signer_name', { length: 255 }).notNull(),
  isGuardian: boolean('is_guardian').default(false).notNull(),
  guardianRelation: varchar('guardian_relation', { length: 100 }),
  witnessName: varchar('witness_name', { length: 255 }),
  pdfUrl: text('pdf_url'), // compiled signed document PDF
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 19. Multi-visit Procedures (Cross-cutting)
export const procedures = pgTable('procedures', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  toothNumber: varchar('tooth_number', { length: 100 }), // can be list or single
  procedureType: varchar('procedure_type', { length: 100 }).notNull(), // RCT, Implant, Ortho
  status: varchar('status', { length: 30 }).default('in_progress').notNull(), // in_progress | completed | abandoned
  startDate: date('start_date').notNull(),
  expectedSittings: integer('expected_sittings'),
  totalCost: numeric('total_cost', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 20. Procedure Steps / Sittings
export const procedureSteps = pgTable('procedure_steps', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  procedureId: uuid('procedure_id').references(() => procedures.id, { onDelete: 'cascade' }).notNull(),
  visitId: uuid('visit_id').references(() => appointments.id, { onDelete: 'set null' }),
  stepNumber: integer('step_number').notNull(),
  stepDescription: varchar('step_description', { length: 255 }).notNull(), // e.g. Access opening, BMP, Obturation
  date: date('date'),
  dentistId: uuid('dentist_id').references(() => users.id, { onDelete: 'set null' }),
  dentistNotes: text('dentist_notes'),
  costForStep: numeric('cost_for_step', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending | completed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 21. Inventory Items (Feature 9)
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // consumable | material | instrument
  unit: varchar('unit', { length: 50 }).notNull(), // pieces | ml | grams | boxes
  currentStock: numeric('current_stock', { precision: 10, scale: 2 }).default('0.00').notNull(),
  reorderThreshold: numeric('reorder_threshold', { precision: 10, scale: 2 }).default('0.00').notNull(),
  unitCost: numeric('unit_cost', { precision: 10, scale: 2 }),
  supplierName: varchar('supplier_name', { length: 255 }),
  supplierContact: varchar('supplier_contact', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 22. Inventory Transactions (Feature 9)
export const inventoryTransactions = pgTable('inventory_transactions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  itemId: uuid('item_id').references(() => inventoryItems.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // restock | usage | adjustment
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  date: date('date').defaultNow().notNull(),
  relatedTreatmentId: uuid('related_treatment_id').references(() => treatments.id, { onDelete: 'set null' }),
  recordedBy: uuid('recorded_by').references(() => users.id).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 23. Lab Orders (Feature 10)
export const labOrders = pgTable('lab_orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  treatmentId: uuid('treatment_id').references(() => treatments.id, { onDelete: 'set null' }),
  toothNumber: varchar('tooth_number', { length: 100 }),
  labName: varchar('lab_name', { length: 255 }).notNull(),
  labContact: varchar('lab_contact', { length: 100 }),
  workType: varchar('work_type', { length: 50 }).notNull(), // crown | bridge | denture | aligner | nightguard | retainer | veneer | inlay_onlay
  shade: varchar('shade', { length: 50 }),
  material: varchar('material', { length: 100 }), // Zirconia | PFM | E-max
  orderDate: date('order_date').defaultNow().notNull(),
  expectedReturnDate: date('expected_return_date'),
  actualReturnDate: date('actual_return_date'),
  status: varchar('status', { length: 30 }).default('ordered').notNull(), // ordered | sent_to_lab | in_progress | received | fitted | rework_needed
  cost: numeric('cost', { precision: 10, scale: 2 }),
  patientCharge: numeric('patient_charge', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 24. Lab Order Status History (Feature 10)
export const labOrderStatusHistory = pgTable('lab_order_status_history', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  labOrderId: uuid('lab_order_id').references(() => labOrders.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 30 }).notNull(),
  changedBy: uuid('changed_by').references(() => users.id).notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  notes: text('notes'),
});

// 25. Clinic Settings (Feature 11)
export const clinicSettings = pgTable('clinic_settings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull().unique(),
  toothNumbering: varchar('tooth_numbering', { length: 20 }).default('fdi').notNull(), // fdi | universal | palmer
  currency: varchar('currency', { length: 10 }).default('INR').notNull(),
  dateFormat: varchar('date_format', { length: 20 }).default('DD/MM/YYYY').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 26. Patient Documents (Cross-cutting document vault)
export const patientDocuments = pgTable('patient_documents', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(), // medical_history | referral | lab_report | insurance | consent | prescription | radiograph | other
  fileUrl: text('file_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  description: text('description'),
  tags: jsonb('tags').default([]).notNull(), // array of strings
  sourceId: uuid('source_id'), // FK to radiographs.id, consents.id, prescriptions.id
  sourceType: varchar('source_type', { length: 50 }), // radiograph | consent | prescription
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 27. Radiograph Annotations (Cross-cutting)
export const radiographAnnotations = pgTable('radiograph_annotations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  radiographId: uuid('radiograph_id').references(() => radiographs.id, { onDelete: 'cascade' }).notNull(),
  annotationJson: text('annotation_json').notNull(), // fabric.js Canvas JSON state
  flattenedUrl: text('flattened_url'), // url to annotated PNG image
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
