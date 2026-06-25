import { ToothCondition } from './tooth-condition.entity';

export interface IToothConditionsRepository {
  create(conditionData: Omit<ToothCondition, 'id' | 'createdAt' | 'updatedAt'>): Promise<ToothCondition>;
  findAllByPatient(tenantId: string, patientId: string, asOfDate?: string): Promise<ToothCondition[]>;
  findByTooth(tenantId: string, patientId: string, toothNumber: string): Promise<ToothCondition[]>;
  findById(tenantId: string, id: string): Promise<ToothCondition | null>;
  update(
    tenantId: string,
    id: string,
    conditionData: Partial<Omit<ToothCondition, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<ToothCondition>;
  delete(tenantId: string, id: string): Promise<void>;
}
