import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IPrescriptionsRepository } from '../domain/prescriptions.repository.interface';
import { Prescription, PrescriptionItem } from '../domain/prescription.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class PrescriptionsRepositoryImpl implements IPrescriptionsRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async create(
    prescriptionData: Omit<Prescription, 'id' | 'createdAt' | 'items'>,
    items: Omit<PrescriptionItem, 'id' | 'prescriptionId'>[],
  ): Promise<Prescription> {
    return this.db.transaction(async (tx) => {
      // 1. Insert Prescription record
      const [prescriptionRow] = await tx
        .insert(schema.prescriptions)
        .values({
          tenantId: prescriptionData.tenantId,
          patientId: prescriptionData.patientId,
          visitId: prescriptionData.visitId,
          dentistId: prescriptionData.dentistId,
          date: prescriptionData.date ? prescriptionData.date.toISOString().split('T')[0] : undefined,
          pdfUrl: prescriptionData.pdfUrl,
        })
        .returning();

      // 2. Insert items list
      const itemRows = [];
      if (items.length > 0) {
        const valuesToInsert = items.map((item) => ({
          prescriptionId: prescriptionRow.id,
          drugName: item.drugName,
          dosage: item.dosage,
          frequency: item.frequency,
          durationDays: item.durationDays,
          instructions: item.instructions,
        }));

        const insertedItems = await tx
          .insert(schema.prescriptionItems)
          .values(valuesToInsert)
          .returning();

        itemRows.push(...insertedItems);
      }

      return this.mapToEntity(prescriptionRow, itemRows);
    });
  }

  async findAllByPatient(tenantId: string, patientId: string): Promise<Prescription[]> {
    const rxRows = await this.db
      .select()
      .from(schema.prescriptions)
      .where(
        and(
          eq(schema.prescriptions.tenantId, tenantId),
          eq(schema.prescriptions.patientId, patientId),
        ),
      )
      .orderBy(schema.prescriptions.createdAt);

    const results = [];
    for (const rx of rxRows) {
      const itemRows = await this.db
        .select()
        .from(schema.prescriptionItems)
        .where(eq(schema.prescriptionItems.prescriptionId, rx.id));

      results.push(this.mapToEntity(rx, itemRows));
    }
    return results;
  }

  async findById(tenantId: string, id: string): Promise<Prescription | null> {
    const rxRows = await this.db
      .select()
      .from(schema.prescriptions)
      .where(
        and(
          eq(schema.prescriptions.tenantId, tenantId),
          eq(schema.prescriptions.id, id),
        ),
      )
      .limit(1);

    if (rxRows.length === 0) return null;
    const rx = rxRows[0];

    const itemRows = await this.db
      .select()
      .from(schema.prescriptionItems)
      .where(eq(schema.prescriptionItems.prescriptionId, rx.id));

    return this.mapToEntity(rx, itemRows);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.db
      .delete(schema.prescriptions)
      .where(
        and(
          eq(schema.prescriptions.tenantId, tenantId),
          eq(schema.prescriptions.id, id),
        ),
      );
  }

  async updatePdfUrl(tenantId: string, id: string, pdfUrl: string): Promise<void> {
    await this.db
      .update(schema.prescriptions)
      .set({ pdfUrl })
      .where(
        and(
          eq(schema.prescriptions.tenantId, tenantId),
          eq(schema.prescriptions.id, id),
        ),
      );
  }

  private mapToEntity(rx: any, itemRows: any[] = []): Prescription {
    return new Prescription(
      rx.id,
      rx.tenantId,
      rx.patientId,
      rx.visitId,
      rx.dentistId,
      rx.date ? new Date(rx.date) : new Date(),
      rx.pdfUrl,
      rx.createdAt,
      itemRows.map((item) => ({
        id: item.id,
        prescriptionId: item.prescriptionId,
        drugName: item.drugName,
        dosage: item.dosage,
        frequency: item.frequency,
        durationDays: item.durationDays,
        instructions: item.instructions,
      })),
    );
  }
}
