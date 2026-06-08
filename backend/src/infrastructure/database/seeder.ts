import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import * as bcrypt from 'bcrypt';

export async function seedDatabase(db: NodePgDatabase<typeof schema>) {
  // Check if tenant exists
  const existingTenants = await db.select().from(schema.tenants).limit(1);
  if (existingTenants.length > 0) {
    console.log('Database already seeded or has data. Skipping seed.');
    return;
  }

  console.log('Seeding demo database...');

  // 1. Create Tenant
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      name: 'Smile Saviours Demo Clinic',
      subdomain: 'demo',
    })
    .returning();

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password', salt);

  // 2. Create Users
  const [admin] = await db
    .insert(schema.users)
    .values({
      tenantId: tenant.id,
      email: 'admin@smile.com',
      passwordHash,
      firstName: 'Emily',
      lastName: 'Stone',
      role: 'ADMIN',
      phone: '555-1001',
    })
    .returning();

  const [dentist] = await db
    .insert(schema.users)
    .values({
      tenantId: tenant.id,
      email: 'dentist@smile.com',
      passwordHash,
      firstName: 'Dr. Arthur',
      lastName: 'Dent',
      role: 'DENTIST',
      phone: '555-1002',
    })
    .returning();

  const [receptionist] = await db
    .insert(schema.users)
    .values({
      tenantId: tenant.id,
      email: 'receptionist@smile.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Connor',
      role: 'RECEPTIONIST',
      phone: '555-1003',
    })
    .returning();

  // 3. Create Patients
  const [patient1] = await db
    .insert(schema.patients)
    .values({
      tenantId: tenant.id,
      firstName: 'John',
      lastName: 'Doe',
      dob: '1988-06-15',
      gender: 'Male',
      phone: '555-0101',
      email: 'john.doe@gmail.com',
      address: '123 Elm St, Springfield',
      medicalHistory: ['Hypertension', 'No known drug allergies'] as any,
      allergies: ['Penicillin'] as any,
    })
    .returning();

  const [patient2] = await db
    .insert(schema.patients)
    .values({
      tenantId: tenant.id,
      firstName: 'Jane',
      lastName: 'Smith',
      dob: '1992-09-24',
      gender: 'Female',
      phone: '555-0102',
      email: 'jane.smith@yahoo.com',
      address: '456 Oak Ave, Shelbyville',
      medicalHistory: ['Asthma'] as any,
      allergies: ['Latex'] as any,
    })
    .returning();

  const [patient3] = await db
    .insert(schema.patients)
    .values({
      tenantId: tenant.id,
      firstName: 'Robert',
      lastName: 'Johnson',
      dob: '1975-12-02',
      gender: 'Male',
      phone: '555-0103',
      email: 'robert.j@outlook.com',
      address: '789 Pine Rd, Capital City',
      medicalHistory: [] as any,
      allergies: [] as any,
    })
    .returning();

  // 4. Create Appointments
  // Today's appointments
  const today1 = new Date();
  today1.setHours(9, 0, 0, 0);
  const today1End = new Date(today1);
  today1End.setHours(10, 0, 0, 0);

  const today2 = new Date();
  today2.setHours(13, 30, 0, 0);
  const today2End = new Date(today2);
  today2End.setHours(14, 15, 0, 0);

  // Tomorrow's appointment
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(12, 0, 0, 0);

  const [appt1] = await db
    .insert(schema.appointments)
    .values({
      tenantId: tenant.id,
      patientId: patient1.id,
      dentistId: dentist.id,
      startTime: today1,
      endTime: today1End,
      status: 'CHECKED_IN',
      reason: 'Routine Cleaning',
      notes: 'Patient reports mild sensitivity in lower left molars',
    })
    .returning();

  const [appt2] = await db
    .insert(schema.appointments)
    .values({
      tenantId: tenant.id,
      patientId: patient2.id,
      dentistId: dentist.id,
      startTime: today2,
      endTime: today2End,
      status: 'SCHEDULED',
      reason: 'Root Canal Therapy',
      notes: 'Second session. Check root canal status.',
    })
    .returning();

  await db.insert(schema.appointments).values({
    tenantId: tenant.id,
    patientId: patient3.id,
    dentistId: dentist.id,
    startTime: tomorrow,
    endTime: tomorrowEnd,
    status: 'SCHEDULED',
    reason: 'Dental Implant Consultation',
    notes: 'Discuss treatment plan and imaging options.',
  });

  // 5. Create Treatments
  const [treatment1] = await db
    .insert(schema.treatments)
    .values({
      tenantId: tenant.id,
      patientId: patient1.id,
      dentistId: dentist.id,
      appointmentId: appt1.id,
      toothNumber: null,
      procedureName: 'Dental Cleaning and Prophylaxis',
      notes: 'Full mouth scaling and polishing completed. Taught flossing technique.',
      price: '150.00',
      status: 'COMPLETED',
    })
    .returning();

  const [treatment2] = await db
    .insert(schema.treatments)
    .values({
      tenantId: tenant.id,
      patientId: patient1.id,
      dentistId: dentist.id,
      appointmentId: appt1.id,
      toothNumber: 14,
      procedureName: 'Composite Filling',
      notes: 'Occlusal decay restored on tooth #14. Used standard shade A2 composite.',
      price: '200.00',
      status: 'COMPLETED',
    })
    .returning();

  const [treatment3] = await db
    .insert(schema.treatments)
    .values({
      tenantId: tenant.id,
      patientId: patient2.id,
      dentistId: dentist.id,
      appointmentId: appt2.id,
      toothNumber: 19,
      procedureName: 'Root Canal treatment',
      notes: 'Access, cleaning, shaping and obturation of distal canal. Temporary restoration placed.',
      price: '800.00',
      status: 'COMPLETED',
    })
    .returning();

  // 6. Create Invoices
  // Invoice 1: Paid invoice for John Doe
  const [invoice1] = await db
    .insert(schema.invoices)
    .values({
      tenantId: tenant.id,
      patientId: patient1.id,
      appointmentId: appt1.id,
      totalAmount: '350.00',
      paidAmount: '350.00',
      status: 'PAID',
      dueDate: new Date().toISOString().split('T')[0] as any,
    })
    .returning();

  await db.insert(schema.invoiceItems).values([
    {
      invoiceId: invoice1.id,
      treatmentId: treatment1.id,
      description: 'Dental Cleaning and Prophylaxis',
      quantity: 1,
      unitPrice: '150.00',
      totalPrice: '150.00',
    },
    {
      invoiceId: invoice1.id,
      treatmentId: treatment2.id,
      description: 'Composite Filling - Tooth #14',
      quantity: 1,
      unitPrice: '200.00',
      totalPrice: '200.00',
    },
  ]);

  // Invoice 2: Unpaid invoice for Jane Smith
  const dueDate2 = new Date();
  dueDate2.setDate(dueDate2.getDate() + 15);

  const [invoice2] = await db
    .insert(schema.invoices)
    .values({
      tenantId: tenant.id,
      patientId: patient2.id,
      appointmentId: appt2.id,
      totalAmount: '800.00',
      paidAmount: '0.00',
      status: 'UNPAID',
      dueDate: dueDate2.toISOString().split('T')[0] as any,
    })
    .returning();

  await db.insert(schema.invoiceItems).values({
    invoiceId: invoice2.id,
    treatmentId: treatment3.id,
    description: 'Root Canal treatment - Tooth #19',
    quantity: 1,
    unitPrice: '800.00',
    totalPrice: '800.00',
  });

  console.log('Database seeded successfully!');
}
