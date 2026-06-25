import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import * as bcrypt from 'bcrypt';

export async function seedDatabase(db: NodePgDatabase<typeof schema>) {
  // Seed Default Drug Templates first (global defaults, independent of tenants)
  const existingDrugs = await db.select().from(schema.drugTemplates).limit(1);
  if (existingDrugs.length === 0) {
    console.log('Seeding default dental drug templates...');
    await db.insert(schema.drugTemplates).values([
      {
        name: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin',
        category: 'antibiotic',
        defaultDosage: '500mg',
        defaultFrequency: '1-0-1',
        defaultDuration: 5,
        defaultInstructions: 'After food',
        contraindications: ['penicillin'],
      },
      {
        name: 'Augmentin 625mg',
        genericName: 'Amoxicillin + Clavulanic Acid',
        category: 'antibiotic',
        defaultDosage: '625mg',
        defaultFrequency: '1-0-1',
        defaultDuration: 5,
        defaultInstructions: 'After food',
        contraindications: ['penicillin'],
      },
      {
        name: 'Metronidazole 400mg',
        genericName: 'Metronidazole',
        category: 'antibiotic',
        defaultDosage: '400mg',
        defaultFrequency: '1-1-1',
        defaultDuration: 5,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Ibuprofen 400mg',
        genericName: 'Ibuprofen',
        category: 'analgesic',
        defaultDosage: '400mg',
        defaultFrequency: '1-0-1',
        defaultDuration: 3,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Diclofenac 50mg',
        genericName: 'Diclofenac',
        category: 'analgesic',
        defaultDosage: '50mg',
        defaultFrequency: '1-0-1',
        defaultDuration: 3,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Aceclofenac 100mg',
        genericName: 'Aceclofenac',
        category: 'analgesic',
        defaultDosage: '100mg',
        defaultFrequency: '1-0-1',
        defaultDuration: 3,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Paracetamol 650mg',
        genericName: 'Paracetamol',
        category: 'analgesic',
        defaultDosage: '650mg',
        defaultFrequency: 'SOS',
        defaultDuration: 3,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Ketorolac 10mg',
        genericName: 'Ketorolac DT',
        category: 'analgesic',
        defaultDosage: '10mg',
        defaultFrequency: '1-0-1',
        defaultDuration: 3,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Tramadol 50mg',
        genericName: 'Tramadol',
        category: 'analgesic',
        defaultDosage: '50mg',
        defaultFrequency: '1-0-1',
        defaultDuration: 3,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Clindamycin 300mg',
        genericName: 'Clindamycin',
        category: 'antibiotic',
        defaultDosage: '300mg',
        defaultFrequency: '1-1-1',
        defaultDuration: 5,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Doxycycline 100mg',
        genericName: 'Doxycycline',
        category: 'antibiotic',
        defaultDosage: '100mg',
        defaultFrequency: '1-0-1',
        defaultDuration: 5,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Cefixime 200mg',
        genericName: 'Cefixime',
        category: 'antibiotic',
        defaultDosage: '200mg',
        defaultFrequency: '1-0-1',
        defaultDuration: 5,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Ornidazole 500mg',
        genericName: 'Ornidazole',
        category: 'antibiotic',
        defaultDosage: '500mg',
        defaultFrequency: '1-0-1',
        defaultDuration: 5,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Fluconazole 150mg',
        genericName: 'Fluconazole',
        category: 'other',
        defaultDosage: '150mg',
        defaultFrequency: '1-0-0',
        defaultDuration: 1,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Pantoprazole 40mg',
        genericName: 'Pantoprazole',
        category: 'other',
        defaultDosage: '40mg',
        defaultFrequency: '1-0-0',
        defaultDuration: 5,
        defaultInstructions: 'Before food',
        contraindications: [],
      },
      {
        name: 'Ranitidine 150mg',
        genericName: 'Ranitidine',
        category: 'other',
        defaultDosage: '150mg',
        defaultFrequency: '1-0-1',
        defaultDuration: 5,
        defaultInstructions: 'Before food',
        contraindications: [],
      },
      {
        name: 'Serratiopeptidase 10mg',
        genericName: 'Serratiopeptidase',
        category: 'other',
        defaultDosage: '10mg',
        defaultFrequency: '1-1-1',
        defaultDuration: 5,
        defaultInstructions: 'Before food',
        contraindications: [],
      },
      {
        name: 'Chymotrypsin+Trypsin',
        genericName: 'Chymoral Forte',
        category: 'other',
        defaultDosage: '1 tab',
        defaultFrequency: '1-1-1',
        defaultDuration: 5,
        defaultInstructions: 'Before food',
        contraindications: [],
      },
      {
        name: 'Chlorhexidine Mouthwash 0.2%',
        genericName: 'Chlorhexidine gluconate',
        category: 'mouthwash',
        defaultDosage: '10ml rinse',
        defaultFrequency: 'BD',
        defaultDuration: 7,
        defaultInstructions: 'Do not eat/drink for 30 min after use',
        contraindications: [],
      },
      {
        name: 'Povidone-Iodine Gargle',
        genericName: 'Povidone-Iodine',
        category: 'mouthwash',
        defaultDosage: '10ml gargle',
        defaultFrequency: 'TDS',
        defaultDuration: 5,
        defaultInstructions: 'Gargle and spit',
        contraindications: [],
      },
      {
        name: 'Betadine Ointment',
        genericName: 'Povidone-Iodine 5%',
        category: 'other',
        defaultDosage: 'Topical apply',
        defaultFrequency: 'BD',
        defaultDuration: 5,
        defaultInstructions: 'Apply on affected area',
        contraindications: [],
      },
      {
        name: 'Lignocaine 2% Gel',
        genericName: 'Lignocaine Hydrochloride',
        category: 'other',
        defaultDosage: 'Topical apply',
        defaultFrequency: 'PRN',
        defaultDuration: 5,
        defaultInstructions: 'Apply before meals on ulcer',
        contraindications: [],
      },
      {
        name: 'Metrogyl DG Gel',
        genericName: 'Metronidazole + Chlorhexidine',
        category: 'other',
        defaultDosage: 'Topical apply',
        defaultFrequency: 'BD',
        defaultDuration: 5,
        defaultInstructions: 'Apply on gums',
        contraindications: [],
      },
      {
        name: 'Calcium + Vitamin D3',
        genericName: 'Calcium + D3',
        category: 'other',
        defaultDosage: '1 tab',
        defaultFrequency: '1-0-0',
        defaultDuration: 30,
        defaultInstructions: 'After food',
        contraindications: [],
      },
      {
        name: 'Multivitamin',
        genericName: 'Multivitamins',
        category: 'other',
        defaultDosage: '1 cap',
        defaultFrequency: '1-0-0',
        defaultDuration: 30,
        defaultInstructions: 'After food',
        contraindications: [],
      },
    ]);
    console.log('Default drug templates seeded successfully.');
  }

  // Check if tenant exists
  const existingTenants = await db.select().from(schema.tenants).limit(1);
  if (existingTenants.length > 0) {
    console.log('Database already seeded or has data. Skipping demo data seed.');
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

  // Seed Default Recall Rules
  await db.insert(schema.recallRules).values([
    {
      tenantId: tenant.id,
      procedureType: 'Routine Cleaning',
      intervalDays: 180,
      recurring: false,
      reminderText: 'Time for your 6-month dental cleaning!',
    },
    {
      tenantId: tenant.id,
      procedureType: 'Root Canal treatment',
      intervalDays: 90,
      recurring: false,
      reminderText: 'Time for your post-root canal checkup.',
    },
    {
      tenantId: tenant.id,
      procedureType: 'Tooth Extraction',
      intervalDays: 7,
      recurring: false,
      reminderText: 'Time for your post-extraction wound check.',
    },
    {
      tenantId: tenant.id,
      procedureType: 'Dental Crown',
      intervalDays: 180,
      recurring: false,
      reminderText: 'Time for your 6-month crown placement checkup.',
    },
    {
      tenantId: tenant.id,
      procedureType: 'Composite Filling',
      intervalDays: 180,
      recurring: false,
      reminderText: 'Time for your 6-month dental filling checkup.',
    },
  ]);

  // Seed Default Consent Templates
  await db.insert(schema.consentTemplates).values([
    {
      tenantId: tenant.id,
      procedureType: 'Tooth Extraction',
      title: 'Informed Consent for Tooth Extraction & Oral Surgery',
      legalText: 'I hereby authorize Dr. Arthur Dent and his clinical designees to perform the surgical extraction of my tooth/teeth. I understand that the risks include but are not limited to: post-operative pain, bleeding, swelling, localized infection (dry socket), temporary or permanent numbness of the lip, chin, or tongue due to nerve proximity, root fracture, sinus complications, and jaw stiffness. I have had the opportunity to discuss alternative treatment choices (e.g. root canal therapy, bridges, implants) and the consequences of no treatment. I freely consent to this procedure.',
      requiresGuardian: false,
    },
    {
      tenantId: tenant.id,
      procedureType: 'Root Canal treatment',
      title: 'Informed Consent for Endodontic Therapy (Root Canal)',
      legalText: 'I authorize Dr. Arthur Dent to perform root canal therapy on the designated tooth. I understand that endodontic therapy is performed to retain a tooth which might otherwise require extraction. Risks include but are not limited to: post-treatment discomfort, swelling, canal calcification, instrument fracture inside the canal, root perforation, and potential treatment failure requiring surgical apicoectomy or extraction. I understand that after a root canal, the tooth becomes brittle and a dental crown is highly recommended to protect it from fracturing. I consent to this treatment plan.',
      requiresGuardian: false,
    },
  ]);

  // Seed Default Clinic Settings
  await db.insert(schema.clinicSettings).values({
    tenantId: tenant.id,
    toothNumbering: 'fdi',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
  });

  // Seed Default Inventory Items
  await db.insert(schema.inventoryItems).values([
    {
      tenantId: tenant.id,
      name: 'Alginate Impression Material',
      category: 'material',
      unit: 'bags',
      currentStock: '15.00',
      reorderThreshold: '5.00',
      unitCost: '12.50',
      supplierName: 'Dental Depot India',
      supplierContact: '+919876543210',
    },
    {
      tenantId: tenant.id,
      name: 'Composite Resin A2',
      category: 'material',
      unit: 'syringes',
      currentStock: '24.00',
      reorderThreshold: '6.00',
      unitCost: '35.00',
      supplierName: 'Dental Depot India',
      supplierContact: '+919876543210',
    },
    {
      tenantId: tenant.id,
      name: 'Disposable Gloves Medium',
      category: 'consumable',
      unit: 'boxes',
      currentStock: '3.00',
      reorderThreshold: '5.00',
      unitCost: '8.00',
      supplierName: 'SafeGuard Health',
      supplierContact: '+919998887776',
    },
    {
      tenantId: tenant.id,
      name: 'Local Anesthetic 2% Lignocaine',
      category: 'consumable',
      unit: 'cartridges',
      currentStock: '100.00',
      reorderThreshold: '30.00',
      unitCost: '1.20',
      supplierName: 'Prime Pharma',
      supplierContact: '+918887776665',
    },
    {
      tenantId: tenant.id,
      name: 'Mouth Mirror No. 4',
      category: 'instrument',
      unit: 'pieces',
      currentStock: '12.00',
      reorderThreshold: '4.00',
      unitCost: '5.00',
      supplierName: 'Dental Depot India',
      supplierContact: '+919876543210',
    },
    {
      tenantId: tenant.id,
      name: 'Sterilization Pouches',
      category: 'consumable',
      unit: 'boxes',
      currentStock: '10.00',
      reorderThreshold: '3.00',
      unitCost: '15.00',
      supplierName: 'Prime Pharma',
      supplierContact: '+918887776665',
    },
    {
      tenantId: tenant.id,
      name: 'Zirconia Crown Blanks',
      category: 'material',
      unit: 'pieces',
      currentStock: '1.00',
      reorderThreshold: '3.00',
      unitCost: '45.00',
      supplierName: 'LabTech Materials',
      supplierContact: '+917776665554',
    }
  ]);

  console.log('Database seeded successfully!');
}
