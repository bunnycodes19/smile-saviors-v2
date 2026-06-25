import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPatientDocumentsRepository } from '../domain/patient-documents.repository.interface';
import { PatientDocument } from '../domain/patient-document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { IFileUploadService } from '../../file-upload/domain/file-upload.interface';

@Injectable()
export class PatientDocumentsService {
  constructor(
    @Inject('IPatientDocumentsRepository')
    private readonly documentsRepository: IPatientDocumentsRepository,
    @Inject('IFileUploadService')
    private readonly fileUploadService: IFileUploadService,
  ) {}

  async uploadDocument(
    tenantId: string,
    dto: CreateDocumentDto,
    file: any,
    userId: string,
  ): Promise<PatientDocument> {
    const uploadResult = await this.fileUploadService.upload(file, `patient_${dto.patientId}_docs`);

    const tagsArray = dto.tags ? dto.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    return this.documentsRepository.createDocument(tenantId, {
      tenantId,
      patientId: dto.patientId,
      documentType: dto.documentType,
      fileUrl: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl || null,
      fileName: file.originalname || 'Document',
      fileSize: file.size || null,
      mimeType: file.mimetype || null,
      uploadedBy: userId,
      description: dto.description ?? null,
      tags: tagsArray,
      sourceId: null,
      sourceType: null,
    });
  }

  async createAutomaticDocument(
    tenantId: string,
    docData: Omit<PatientDocument, 'id' | 'createdAt'>,
  ): Promise<PatientDocument> {
    return this.documentsRepository.createDocument(tenantId, docData);
  }

  async findDocumentsByPatient(
    tenantId: string,
    patientId: string,
    filters?: { type?: string },
  ): Promise<PatientDocument[]> {
    return this.documentsRepository.findDocumentsByPatient(tenantId, patientId, filters);
  }

  async deleteDocument(tenantId: string, id: string): Promise<void> {
    const doc = await this.documentsRepository.findDocumentById(tenantId, id);
    if (!doc) {
      throw new NotFoundException(`Patient document with ID ${id} not found`);
    }

    try {
      await this.fileUploadService.delete(doc.fileUrl);
    } catch (err) {
      // Ignore deletion errors for cleanup robustness
    }

    await this.documentsRepository.deleteDocument(tenantId, id);
  }
}
