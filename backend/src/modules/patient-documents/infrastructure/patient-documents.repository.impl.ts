import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IPatientDocumentsRepository } from '../domain/patient-documents.repository.interface';
import { PatientDocument } from '../domain/patient-document.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class PatientDocumentsRepositoryImpl implements IPatientDocumentsRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async createDocument(
    tenantId: string,
    docData: Omit<PatientDocument, 'id' | 'createdAt'>,
  ): Promise<PatientDocument> {
    const [row] = await this.db
      .insert(schema.patientDocuments)
      .values({
        tenantId,
        patientId: docData.patientId,
        documentType: docData.documentType,
        fileUrl: docData.fileUrl,
        thumbnailUrl: docData.thumbnailUrl,
        fileName: docData.fileName,
        fileSize: docData.fileSize,
        mimeType: docData.mimeType,
        uploadedBy: docData.uploadedBy,
        description: docData.description,
        tags: docData.tags,
        sourceId: docData.sourceId,
        sourceType: docData.sourceType,
      })
      .returning();
    return this.mapToEntity(row);
  }

  async findDocumentById(tenantId: string, id: string): Promise<PatientDocument | null> {
    const [row] = await this.db
      .select()
      .from(schema.patientDocuments)
      .where(and(eq(schema.patientDocuments.tenantId, tenantId), eq(schema.patientDocuments.id, id)))
      .limit(1);
    return row ? this.mapToEntity(row) : null;
  }

  async findDocumentsByPatient(
    tenantId: string,
    patientId: string,
    filters?: { type?: string },
  ): Promise<PatientDocument[]> {
    let whereClause = and(
      eq(schema.patientDocuments.tenantId, tenantId),
      eq(schema.patientDocuments.patientId, patientId),
    );
    
    if (filters?.type) {
      whereClause = and(whereClause, eq(schema.patientDocuments.documentType, filters.type)) as any;
    }
    
    const rows = await this.db
      .select()
      .from(schema.patientDocuments)
      .where(whereClause)
      .orderBy(schema.patientDocuments.createdAt);
      
    return rows.map(r => this.mapToEntity(r));
  }

  async deleteDocument(tenantId: string, id: string): Promise<void> {
    await this.db
      .delete(schema.patientDocuments)
      .where(and(eq(schema.patientDocuments.tenantId, tenantId), eq(schema.patientDocuments.id, id)));
  }

  private mapToEntity(row: any): PatientDocument {
    return new PatientDocument(
      row.id,
      row.tenantId,
      row.patientId,
      row.documentType,
      row.fileUrl,
      row.thumbnailUrl,
      row.fileName,
      row.fileSize,
      row.mimeType,
      row.uploadedBy,
      row.description,
      row.tags as string[] || [],
      row.sourceId,
      row.sourceType,
      row.createdAt,
    );
  }
}
