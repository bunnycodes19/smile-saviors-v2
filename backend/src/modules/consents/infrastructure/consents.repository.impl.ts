import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, or, isNull } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IConsentsRepository } from '../domain/consents.repository.interface';
import { ConsentTemplate } from '../domain/consent-template.entity';
import { Consent } from '../domain/consent.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class ConsentsRepositoryImpl implements IConsentsRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  // Templates
  async createTemplate(templateData: Omit<ConsentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConsentTemplate> {
    const [row] = await this.db
      .insert(schema.consentTemplates)
      .values({
        tenantId: templateData.tenantId,
        procedureType: templateData.procedureType,
        title: templateData.title,
        legalText: templateData.legalText,
        requiresGuardian: templateData.requiresGuardian,
      })
      .returning();
    return this.mapToTemplateEntity(row);
  }

  async findTemplatesByTenant(tenantId: string): Promise<ConsentTemplate[]> {
    const rows = await this.db
      .select()
      .from(schema.consentTemplates)
      .where(
        or(
          eq(schema.consentTemplates.tenantId, tenantId),
          isNull(schema.consentTemplates.tenantId)
        )
      );
    return rows.map(r => this.mapToTemplateEntity(r));
  }

  async findTemplateById(tenantId: string, id: string): Promise<ConsentTemplate | null> {
    const [row] = await this.db
      .select()
      .from(schema.consentTemplates)
      .where(
        and(
          eq(schema.consentTemplates.id, id),
          or(
            eq(schema.consentTemplates.tenantId, tenantId),
            isNull(schema.consentTemplates.tenantId)
          )
        )
      )
      .limit(1);
    return row ? this.mapToTemplateEntity(row) : null;
  }

  async findTemplateByProcedureType(tenantId: string, procedureType: string): Promise<ConsentTemplate | null> {
    // Checks for direct or null (system defaults) templates
    const [row] = await this.db
      .select()
      .from(schema.consentTemplates)
      .where(
        and(
          eq(schema.consentTemplates.procedureType, procedureType),
          or(
            eq(schema.consentTemplates.tenantId, tenantId),
            isNull(schema.consentTemplates.tenantId)
          )
        )
      )
      .orderBy(schema.consentTemplates.tenantId)
      .limit(1);
    return row ? this.mapToTemplateEntity(row) : null;
  }

  // Consents
  async createConsent(consentData: Omit<Consent, 'id' | 'createdAt'>): Promise<Consent> {
    const [row] = await this.db
      .insert(schema.consents)
      .values({
        tenantId: consentData.tenantId,
        patientId: consentData.patientId,
        treatmentId: consentData.treatmentId,
        templateId: consentData.templateId,
        signedImageUrl: consentData.signedImageUrl,
        signedAt: consentData.signedAt,
        signerName: consentData.signerName,
        isGuardian: consentData.isGuardian,
        guardianRelation: consentData.guardianRelation,
        witnessName: consentData.witnessName,
        pdfUrl: consentData.pdfUrl,
        ipAddress: consentData.ipAddress,
      })
      .returning();
    return this.mapToConsentEntity(row);
  }

  async findConsentsByPatient(tenantId: string, patientId: string): Promise<any[]> {
    const rows = await this.db
      .select({
        consent: schema.consents,
        templateTitle: schema.consentTemplates.title,
        procedureType: schema.consentTemplates.procedureType,
      })
      .from(schema.consents)
      .innerJoin(schema.consentTemplates, eq(schema.consents.templateId, schema.consentTemplates.id))
      .where(
        and(
          eq(schema.consents.tenantId, tenantId),
          eq(schema.consents.patientId, patientId)
        )
      )
      .orderBy(schema.consents.signedAt);
    return rows;
  }

  async findConsentById(tenantId: string, id: string): Promise<Consent | null> {
    const [row] = await this.db
      .select()
      .from(schema.consents)
      .where(and(eq(schema.consents.tenantId, tenantId), eq(schema.consents.id, id)))
      .limit(1);
    return row ? this.mapToConsentEntity(row) : null;
  }

  async findConsentByTreatment(tenantId: string, treatmentId: string): Promise<Consent | null> {
    const [row] = await this.db
      .select()
      .from(schema.consents)
      .where(and(eq(schema.consents.tenantId, tenantId), eq(schema.consents.treatmentId, treatmentId)))
      .limit(1);
    return row ? this.mapToConsentEntity(row) : null;
  }

  private mapToTemplateEntity(row: any): ConsentTemplate {
    return new ConsentTemplate(
      row.id,
      row.tenantId,
      row.procedureType,
      row.title,
      row.legalText,
      row.requiresGuardian,
      row.createdAt,
      row.updatedAt,
    );
  }

  private mapToConsentEntity(row: any): Consent {
    return new Consent(
      row.id,
      row.tenantId,
      row.patientId,
      row.treatmentId,
      row.templateId,
      row.signedImageUrl,
      row.signedAt,
      row.signerName,
      row.isGuardian,
      row.guardianRelation,
      row.witnessName,
      row.pdfUrl,
      row.ipAddress,
      row.createdAt,
    );
  }
}
