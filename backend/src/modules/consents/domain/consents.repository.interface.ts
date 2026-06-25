import { ConsentTemplate } from './consent-template.entity';
import { Consent } from './consent.entity';

export interface IConsentsRepository {
  createTemplate(templateData: Omit<ConsentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConsentTemplate>;
  findTemplatesByTenant(tenantId: string): Promise<ConsentTemplate[]>;
  findTemplateById(tenantId: string, id: string): Promise<ConsentTemplate | null>;
  findTemplateByProcedureType(tenantId: string, procedureType: string): Promise<ConsentTemplate | null>;

  createConsent(consentData: Omit<Consent, 'id' | 'createdAt'>): Promise<Consent>;
  findConsentsByPatient(tenantId: string, patientId: string): Promise<any[]>;
  findConsentById(tenantId: string, id: string): Promise<Consent | null>;
  findConsentByTreatment(tenantId: string, treatmentId: string): Promise<Consent | null>;
}
