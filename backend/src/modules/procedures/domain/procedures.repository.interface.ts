import { Procedure } from './procedure.entity';
import { ProcedureStep } from './procedure-step.entity';

export interface IProceduresRepository {
  createProcedure(procedureData: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>): Promise<Procedure>;
  findProceduresByPatient(tenantId: string, patientId: string): Promise<Procedure[]>;
  findProcedureById(tenantId: string, id: string): Promise<Procedure | null>;
  updateProcedure(
    tenantId: string,
    id: string,
    procedureData: Partial<Omit<Procedure, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Procedure>;

  createProcedureStep(stepData: Omit<ProcedureStep, 'id' | 'createdAt'>): Promise<ProcedureStep>;
  findStepsByProcedure(tenantId: string, procedureId: string): Promise<ProcedureStep[]>;
  findStepById(tenantId: string, id: string): Promise<ProcedureStep | null>;
  updateProcedureStep(
    tenantId: string,
    id: string,
    stepData: Partial<Omit<ProcedureStep, 'id' | 'tenantId' | 'createdAt'>>,
  ): Promise<ProcedureStep>;
}
