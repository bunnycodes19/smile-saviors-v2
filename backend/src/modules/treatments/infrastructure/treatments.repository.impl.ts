import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { ITreatmentsRepository } from '../domain/treatments.repository.interface';
import { Treatment } from '../domain/treatment.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class TreatmentsRepositoryImpl implements ITreatmentsRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async create(treatmentData: Omit<Treatment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Treatment> {
    const [row] = await this.db
      .insert(schema.treatments)
      .values({
        tenantId: treatmentData.tenantId,
        patientId: treatmentData.patientId,
        dentistId: treatmentData.dentistId,
        appointmentId: treatmentData.appointmentId,
        toothNumber: treatmentData.toothNumber,
        procedureName: treatmentData.procedureName,
        notes: treatmentData.notes,
        price: treatmentData.price,
        status: treatmentData.status,
        chiefComplaint: treatmentData.chiefComplaint,
        symptoms: treatmentData.symptoms,
        diagnosis: treatmentData.diagnosis,
        followUpInstructions: treatmentData.followUpInstructions,
        clinicalNotes: treatmentData.clinicalNotes,
        estimatedCost: treatmentData.estimatedCost,
        acceptedAt: treatmentData.acceptedAt ? new Date(treatmentData.acceptedAt) : null,
        completedAt: treatmentData.completedAt ? new Date(treatmentData.completedAt) : null,
        treatmentGroupId: treatmentData.treatmentGroupId,
      } as any)
      .returning();

    return this.mapToEntity(row);
  }

  async findByPatientId(tenantId: string, patientId: string): Promise<Treatment[]> {
    const rows = await this.db
      .select()
      .from(schema.treatments)
      .where(and(eq(schema.treatments.tenantId, tenantId), eq(schema.treatments.patientId, patientId)))
      .orderBy(schema.treatments.createdAt);

    return rows.map((row) => this.mapToEntity(row));
  }

  async findById(tenantId: string, id: string): Promise<Treatment | null> {
    const rows = await this.db
      .select()
      .from(schema.treatments)
      .where(and(eq(schema.treatments.tenantId, tenantId), eq(schema.treatments.id, id)))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<Omit<Treatment, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Treatment> {
    const updateData: any = { ...data };
    
    if (data.acceptedAt) {
      updateData.acceptedAt = new Date(data.acceptedAt);
    }
    if (data.completedAt) {
      updateData.completedAt = new Date(data.completedAt);
    }

    const [row] = await this.db
      .update(schema.treatments)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.treatments.tenantId, tenantId), eq(schema.treatments.id, id)))
      .returning();

    if (!row) {
      throw new NotFoundException(`Treatment record with ID ${id} not found`);
    }

    return this.mapToEntity(row);
  }

  private mapToEntity(row: any): Treatment {
    return new Treatment(
      row.id,
      row.tenantId,
      row.patientId,
      row.dentistId,
      row.appointmentId,
      row.toothNumber,
      row.procedureName,
      row.notes,
      row.price ? row.price.toString() : '0.00',
      row.status,
      row.createdAt,
      row.updatedAt,
      row.chiefComplaint,
      row.symptoms,
      row.diagnosis,
      row.followUpInstructions,
      row.clinicalNotes,
      row.estimatedCost ? row.estimatedCost.toString() : null,
      row.acceptedAt ? new Date(row.acceptedAt) : null,
      row.completedAt ? new Date(row.completedAt) : null,
      row.treatmentGroupId,
    );
  }
}
