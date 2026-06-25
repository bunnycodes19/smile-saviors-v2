import { Prescription } from './prescription.entity';

export interface IPrescriptionsRepository {
  create(
    prescriptionData: Omit<Prescription, 'id' | 'createdAt' | 'items'>,
    items: Omit<Prescription['items'][number], 'id' | 'prescriptionId'>[],
  ): Promise<Prescription>;
  findAllByPatient(tenantId: string, patientId: string): Promise<Prescription[]>;
  findById(tenantId: string, id: string): Promise<Prescription | null>;
  delete(tenantId: string, id: string): Promise<void>;
  updatePdfUrl(tenantId: string, id: string, pdfUrl: string): Promise<void>;
}
