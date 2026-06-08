import { Injectable, Inject } from '@nestjs/common';
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
      })
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
      row.price.toString(),
      row.status as any,
      row.createdAt,
      row.updatedAt,
    );
  }
}
