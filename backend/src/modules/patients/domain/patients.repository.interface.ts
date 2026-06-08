import { Patient } from './patient.entity';

export interface IPatientsRepository {
  create(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient>;
  findAll(tenantId: string, search?: string): Promise<Patient[]>;
  findById(tenantId: string, id: string): Promise<Patient | null>;
  update(tenantId: string, id: string, patientData: Partial<Omit<Patient, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<Patient>;
}
