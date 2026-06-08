import { Treatment } from './treatment.entity';

export interface ITreatmentsRepository {
  create(treatmentData: Omit<Treatment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Treatment>;
  findByPatientId(tenantId: string, patientId: string): Promise<Treatment[]>;
  findById(tenantId: string, id: string): Promise<Treatment | null>;
}
