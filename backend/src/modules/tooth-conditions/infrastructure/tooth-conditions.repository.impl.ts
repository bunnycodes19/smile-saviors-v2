import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, lte } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IToothConditionsRepository } from '../domain/tooth-conditions.repository.interface';
import { ToothCondition } from '../domain/tooth-condition.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class ToothConditionsRepositoryImpl implements IToothConditionsRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async create(conditionData: Omit<ToothCondition, 'id' | 'createdAt' | 'updatedAt'>): Promise<ToothCondition> {
    const [row] = await this.db
      .insert(schema.toothConditions)
      .values({
        tenantId: conditionData.tenantId,
        patientId: conditionData.patientId,
        toothNumber: conditionData.toothNumber,
        surface: conditionData.surface,
        conditionCode: conditionData.conditionCode,
        status: conditionData.status,
        dateRecorded: conditionData.dateRecorded ? conditionData.dateRecorded.toISOString().split('T')[0] : undefined,
        visitId: conditionData.visitId,
        dentistId: conditionData.dentistId,
        notes: conditionData.notes,
      })
      .returning();

    return this.mapToEntity(row);
  }

  async findAllByPatient(tenantId: string, patientId: string, asOfDate?: string): Promise<ToothCondition[]> {
    let whereClause = and(
      eq(schema.toothConditions.tenantId, tenantId),
      eq(schema.toothConditions.patientId, patientId),
    );

    if (asOfDate) {
      whereClause = and(whereClause, lte(schema.toothConditions.dateRecorded, asOfDate)) as any;
    }

    const rows = await this.db
      .select()
      .from(schema.toothConditions)
      .where(whereClause)
      .orderBy(schema.toothConditions.dateRecorded);

    return rows.map((row) => this.mapToEntity(row));
  }

  async findByTooth(tenantId: string, patientId: string, toothNumber: string): Promise<ToothCondition[]> {
    const rows = await this.db
      .select()
      .from(schema.toothConditions)
      .where(
        and(
          eq(schema.toothConditions.tenantId, tenantId),
          eq(schema.toothConditions.patientId, patientId),
          eq(schema.toothConditions.toothNumber, toothNumber),
        ),
      )
      .orderBy(schema.toothConditions.dateRecorded);

    return rows.map((row) => this.mapToEntity(row));
  }

  async findById(tenantId: string, id: string): Promise<ToothCondition | null> {
    const rows = await this.db
      .select()
      .from(schema.toothConditions)
      .where(and(eq(schema.toothConditions.tenantId, tenantId), eq(schema.toothConditions.id, id)))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  async update(
    tenantId: string,
    id: string,
    conditionData: Partial<Omit<ToothCondition, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<ToothCondition> {
    const updateData: any = { ...conditionData };
    if (conditionData.dateRecorded) {
      updateData.dateRecorded = conditionData.dateRecorded.toISOString().split('T')[0];
    }

    const [row] = await this.db
      .update(schema.toothConditions)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.toothConditions.tenantId, tenantId), eq(schema.toothConditions.id, id)))
      .returning();

    if (!row) {
      throw new NotFoundException(`Tooth condition with ID ${id} not found`);
    }

    return this.mapToEntity(row);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.db
      .delete(schema.toothConditions)
      .where(and(eq(schema.toothConditions.tenantId, tenantId), eq(schema.toothConditions.id, id)));
  }

  private mapToEntity(row: any): ToothCondition {
    return new ToothCondition(
      row.id,
      row.tenantId,
      row.patientId,
      row.toothNumber,
      row.surface,
      row.conditionCode,
      row.status,
      row.dateRecorded ? new Date(row.dateRecorded) : new Date(),
      row.visitId,
      row.dentistId,
      row.notes,
      row.createdAt,
      row.updatedAt,
    );
  }
}
