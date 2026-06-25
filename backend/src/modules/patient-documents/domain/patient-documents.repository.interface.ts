import { PatientDocument } from './patient-document.entity';

export interface IPatientDocumentsRepository {
  createDocument(tenantId: string, doc: Omit<PatientDocument, 'id' | 'createdAt'>): Promise<PatientDocument>;
  findDocumentById(tenantId: string, id: string): Promise<PatientDocument | null>;
  findDocumentsByPatient(tenantId: string, patientId: string, filters?: { type?: string }): Promise<PatientDocument[]>;
  deleteDocument(tenantId: string, id: string): Promise<void>;
}
