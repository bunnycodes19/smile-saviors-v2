import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../infrastructure/database/database.provider';
import * as schema from '../../infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';

export interface TimelineEvent {
  id: string;
  type: 'treatment' | 'appointment' | 'prescription' | 'radiograph' | 'tooth_condition' | 'invoice' | 'consent';
  date: string;
  title: string;
  description: string;
  status?: string;
  metadata: Record<string, any>;
}

@Injectable()
export class TimelineService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async getPatientTimeline(tenantId: string, patientId: string): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];

    // 1. Fetch appointments
    const appts = await this.db
      .select()
      .from(schema.appointments)
      .where(and(eq(schema.appointments.tenantId, tenantId), eq(schema.appointments.patientId, patientId)));
    
    appts.forEach((a) => {
      events.push({
        id: a.id,
        type: 'appointment',
        date: a.startTime.toISOString(),
        title: `Appointment: ${a.reason}`,
        description: a.notes || 'Scheduled appointment',
        status: a.status,
        metadata: { dentistId: a.dentistId, endTime: a.endTime.toISOString() },
      });
    });

    // 2. Fetch treatments
    const treatments = await this.db
      .select()
      .from(schema.treatments)
      .where(and(eq(schema.treatments.tenantId, tenantId), eq(schema.treatments.patientId, patientId)));
    
    treatments.forEach((t) => {
      events.push({
        id: t.id,
        type: 'treatment',
        date: t.completedAt ? new Date(t.completedAt).toISOString() : t.createdAt.toISOString(),
        title: `Procedure: ${t.procedureName}`,
        description: t.notes || t.clinicalNotes || 'Dental procedure logged',
        status: t.status,
        metadata: { toothNumber: t.toothNumber, price: t.price, estimatedCost: t.estimatedCost },
      });
    });

    // 3. Fetch prescriptions
    const rxList = await this.db
      .select()
      .from(schema.prescriptions)
      .where(and(eq(schema.prescriptions.tenantId, tenantId), eq(schema.prescriptions.patientId, patientId)));
    
    for (const rx of rxList) {
      const items = await this.db
        .select()
        .from(schema.prescriptionItems)
        .where(eq(schema.prescriptionItems.prescriptionId, rx.id));
      
      const drugsSummary = items.map((i) => i.drugName).join(', ');
      events.push({
        id: rx.id,
        type: 'prescription',
        date: rx.date ? new Date(rx.date).toISOString() : rx.createdAt.toISOString(),
        title: 'Prescription Issued',
        description: drugsSummary ? `Prescribed: ${drugsSummary}` : 'Prescription generated',
        metadata: { pdfUrl: rx.pdfUrl, itemCount: items.length },
      });
    }

    // 4. Fetch radiographs
    const radiographs = await this.db
      .select()
      .from(schema.radiographs)
      .where(and(eq(schema.radiographs.tenantId, tenantId), eq(schema.radiographs.patientId, patientId)));
    
    radiographs.forEach((r) => {
      events.push({
        id: r.id,
        type: 'radiograph',
        date: r.takenDate ? new Date(r.takenDate).toISOString() : r.createdAt.toISOString(),
        title: `X-Ray Uploaded (${r.imageType.toUpperCase()})`,
        description: r.notes || `Tagged to teeth: ${r.toothNumbers || 'General'}`,
        metadata: { imageUrl: r.imageUrl, imageType: r.imageType },
      });
    });

    // 5. Fetch tooth conditions
    const conditions = await this.db
      .select()
      .from(schema.toothConditions)
      .where(and(eq(schema.toothConditions.tenantId, tenantId), eq(schema.toothConditions.patientId, patientId)));
    
    conditions.forEach((c) => {
      const surfaceText = c.surface ? ` (${c.surface})` : '';
      events.push({
        id: c.id,
        type: 'tooth_condition',
        date: c.dateRecorded ? new Date(c.dateRecorded).toISOString() : c.createdAt.toISOString(),
        title: `Tooth Condition: ${c.conditionCode.toUpperCase()} on Tooth #${c.toothNumber}${surfaceText}`,
        description: c.notes || `Recorded status: ${c.status}`,
        status: c.status,
        metadata: { toothNumber: c.toothNumber, surface: c.surface, conditionCode: c.conditionCode },
      });
    });

    // 6. Fetch invoices
    const invoices = await this.db
      .select()
      .from(schema.invoices)
      .where(and(eq(schema.invoices.tenantId, tenantId), eq(schema.invoices.patientId, patientId)));
    
    invoices.forEach((i) => {
      events.push({
        id: i.id,
        type: 'invoice',
        date: i.createdAt.toISOString(),
        title: `Invoice Generated: $${i.totalAmount}`,
        description: `Status: ${i.status} | Paid: $${i.paidAmount}`,
        status: i.status,
        metadata: { totalAmount: i.totalAmount, paidAmount: i.paidAmount },
      });
    });

    // 7. Fetch signed consents
    const patientConsents = await this.db
      .select()
      .from(schema.consents)
      .where(and(eq(schema.consents.tenantId, tenantId), eq(schema.consents.patientId, patientId)));
    
    for (const c of patientConsents) {
      const [template] = await this.db
        .select()
        .from(schema.consentTemplates)
        .where(eq(schema.consentTemplates.id, c.templateId))
        .limit(1);
      
      events.push({
        id: c.id,
        type: 'consent',
        date: c.signedAt.toISOString(),
        title: `Consent Signed: ${template ? template.title : 'Informed Consent'}`,
        description: `Signed by: ${c.signerName} ${c.isGuardian ? '(Guardian)' : '(Patient)'}`,
        metadata: { pdfUrl: c.pdfUrl, signerName: c.signerName },
      });
    }

    // Sort events by date descending
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
