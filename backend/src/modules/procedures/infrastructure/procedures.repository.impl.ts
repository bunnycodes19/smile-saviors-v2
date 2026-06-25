import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IProceduresRepository } from '../domain/procedures.repository.interface';
import { Procedure } from '../domain/procedure.entity';
import { ProcedureStep } from '../domain/procedure-step.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class ProceduresRepositoryImpl implements IProceduresRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  // Procedures
  async createProcedure(procedureData: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>): Promise<Procedure> {
    const [row] = await this.db
      .insert(schema.procedures)
      .values({
        tenantId: procedureData.tenantId,
        patientId: procedureData.patientId,
        toothNumber: procedureData.toothNumber,
        procedureType: procedureData.procedureType,
        status: procedureData.status,
        startDate: procedureData.startDate.toISOString().split('T')[0] as any,
        expectedSittings: procedureData.expectedSittings,
        totalCost: procedureData.totalCost,
        notes: procedureData.notes,
      })
      .returning();
    return this.mapToProcedureEntity(row);
  }

  async findProceduresByPatient(tenantId: string, patientId: string): Promise<Procedure[]> {
    const rows = await this.db
      .select()
      .from(schema.procedures)
      .where(and(eq(schema.procedures.tenantId, tenantId), eq(schema.procedures.patientId, patientId)))
      .orderBy(schema.procedures.startDate);
    return rows.map(r => this.mapToProcedureEntity(r));
  }

  async findProcedureById(tenantId: string, id: string): Promise<Procedure | null> {
    const [row] = await this.db
      .select()
      .from(schema.procedures)
      .where(and(eq(schema.procedures.tenantId, tenantId), eq(schema.procedures.id, id)))
      .limit(1);
    return row ? this.mapToProcedureEntity(row) : null;
  }

  async updateProcedure(
    tenantId: string,
    id: string,
    procedureData: Partial<Omit<Procedure, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Procedure> {
    const updateData: any = { ...procedureData };
    if (procedureData.startDate) {
      updateData.startDate = procedureData.startDate.toISOString().split('T')[0];
    }

    const [row] = await this.db
      .update(schema.procedures)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.procedures.tenantId, tenantId), eq(schema.procedures.id, id)))
      .returning();

    if (!row) {
      throw new NotFoundException(`Procedure with ID ${id} not found`);
    }
    return this.mapToProcedureEntity(row);
  }

  // Steps
  async createProcedureStep(stepData: Omit<ProcedureStep, 'id' | 'createdAt'>): Promise<ProcedureStep> {
    const [row] = await this.db
      .insert(schema.procedureSteps)
      .values({
        tenantId: stepData.tenantId,
        procedureId: stepData.procedureId,
        visitId: stepData.visitId,
        stepNumber: stepData.stepNumber,
        stepDescription: stepData.stepDescription,
        date: stepData.date ? stepData.date.toISOString().split('T')[0] as any : null,
        dentistId: stepData.dentistId,
        dentistNotes: stepData.dentistNotes,
        costForStep: stepData.costForStep,
        status: stepData.status,
      })
      .returning();
    return this.mapToStepEntity(row);
  }

  async findStepsByProcedure(tenantId: string, procedureId: string): Promise<ProcedureStep[]> {
    const rows = await this.db
      .select()
      .from(schema.procedureSteps)
      .where(and(eq(schema.procedureSteps.tenantId, tenantId), eq(schema.procedureSteps.procedureId, procedureId)))
      .orderBy(schema.procedureSteps.stepNumber);
    return rows.map(r => this.mapToStepEntity(r));
  }

  async findStepById(tenantId: string, id: string): Promise<ProcedureStep | null> {
    const [row] = await this.db
      .select()
      .from(schema.procedureSteps)
      .where(and(eq(schema.procedureSteps.tenantId, tenantId), eq(schema.procedureSteps.id, id)))
      .limit(1);
    return row ? this.mapToStepEntity(row) : null;
  }

  async updateProcedureStep(
    tenantId: string,
    id: string,
    stepData: Partial<Omit<ProcedureStep, 'id' | 'tenantId' | 'createdAt'>>,
  ): Promise<ProcedureStep> {
    const updateData: any = { ...stepData };
    if (stepData.date) {
      updateData.date = stepData.date.toISOString().split('T')[0];
    }

    const [row] = await this.db
      .update(schema.procedureSteps)
      .set(updateData)
      .where(and(eq(schema.procedureSteps.tenantId, tenantId), eq(schema.procedureSteps.id, id)))
      .returning();

    if (!row) {
      throw new NotFoundException(`Procedure Step with ID ${id} not found`);
    }
    return this.mapToStepEntity(row);
  }

  private mapToProcedureEntity(row: any): Procedure {
    return new Procedure(
      row.id,
      row.tenantId,
      row.patientId,
      row.toothNumber ? String(row.toothNumber) : null,
      row.procedureType,
      row.status,
      row.startDate ? new Date(row.startDate) : new Date(),
      row.expectedSittings,
      row.totalCost,
      row.notes,
      row.createdAt,
      row.updatedAt,
    );
  }

  private mapToStepEntity(row: any): ProcedureStep {
    return new ProcedureStep(
      row.id,
      row.tenantId,
      row.procedureId,
      row.visitId,
      row.stepNumber,
      row.stepDescription,
      row.date ? new Date(row.date) : null,
      row.dentistId,
      row.dentistNotes,
      row.costForStep,
      row.status,
      row.createdAt,
    );
  }
}
