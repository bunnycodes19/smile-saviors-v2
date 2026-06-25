import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IConsentsRepository } from '../domain/consents.repository.interface';
import { IFileUploadService } from '../../file-upload/domain/file-upload.interface';
import { IPdfGenerationService } from '../../pdf-generation/domain/pdf-generation.interface';
import { PatientsService } from '../../patients/application/patients.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { Consent } from '../domain/consent.entity';
import { ConsentTemplate } from '../domain/consent-template.entity';
import { PatientDocumentsService } from '../../patient-documents/application/patient-documents.service';

@Injectable()
export class ConsentsService {
  constructor(
    @Inject('IConsentsRepository')
    private readonly consentsRepository: IConsentsRepository,
    @Inject('IFileUploadService')
    private readonly fileUploadService: IFileUploadService,
    @Inject('IPdfGenerationService')
    private readonly pdfGenerationService: IPdfGenerationService,
    private readonly patientsService: PatientsService,
    private readonly patientDocumentsService: PatientDocumentsService,
  ) {}

  async createTemplate(
    tenantId: string,
    dto: { procedureType: string; title: string; legalText: string; requiresGuardian: boolean }
  ): Promise<ConsentTemplate> {
    return this.consentsRepository.createTemplate({
      tenantId,
      procedureType: dto.procedureType,
      title: dto.title,
      legalText: dto.legalText,
      requiresGuardian: dto.requiresGuardian,
    });
  }

  async getTemplates(tenantId: string): Promise<ConsentTemplate[]> {
    return this.consentsRepository.findTemplatesByTenant(tenantId);
  }

  async getTemplateById(tenantId: string, id: string): Promise<ConsentTemplate> {
    const template = await this.consentsRepository.findTemplateById(tenantId, id);
    if (!template) {
      throw new NotFoundException(`Consent template with ID ${id} not found`);
    }
    return template;
  }

  async getConsentsByPatient(tenantId: string, patientId: string): Promise<any[]> {
    return this.consentsRepository.findConsentsByPatient(tenantId, patientId);
  }

  async checkConsentForTreatment(tenantId: string, treatmentId: string): Promise<boolean> {
    const consent = await this.consentsRepository.findConsentByTreatment(tenantId, treatmentId);
    return !!consent;
  }

  async createConsent(tenantId: string, dto: CreateConsentDto): Promise<Consent> {
    const patient = await this.patientsService.findById(tenantId, dto.patientId);
    const template = await this.getTemplateById(tenantId, dto.templateId);

    const sigBuffer = Buffer.from(dto.signatureData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const mockFile = {
      buffer: sigBuffer,
      originalname: `signature_${dto.patientId}_${Date.now()}.png`,
      mimetype: 'image/png',
    };
    const uploadSig = await this.fileUploadService.upload(mockFile, 'signatures');

    const patientAge = new Date().getFullYear() - new Date(patient.dob).getFullYear();
    const pdfBuffer = await this.pdfGenerationService.generateConsent({
      clinicName: 'Smile Saviours Dental Clinic',
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientAge,
      patientGender: patient.gender,
      procedureType: template.procedureType,
      title: template.title,
      legalText: template.legalText,
      date: new Date().toLocaleDateString(),
      signerName: dto.signerName,
      isGuardian: dto.isGuardian,
      guardianRelation: dto.guardianRelation,
      signedImageUrl: uploadSig.url,
    });

    const mockPdfFile = {
      buffer: pdfBuffer,
      originalname: `consent_${dto.patientId}_${Date.now()}.pdf`,
      mimetype: 'application/pdf',
    };
    const uploadPdf = await this.fileUploadService.upload(mockPdfFile, 'consents');

    const consent = await this.consentsRepository.createConsent({
      tenantId,
      patientId: dto.patientId,
      treatmentId: dto.treatmentId || null,
      templateId: dto.templateId,
      signedImageUrl: uploadSig.url,
      signedAt: new Date(),
      signerName: dto.signerName,
      isGuardian: dto.isGuardian,
      guardianRelation: dto.guardianRelation || null,
      witnessName: dto.witnessName || null,
      pdfUrl: uploadPdf.url,
      ipAddress: null,
    });

    // Auto-register in document vault
    try {
      await this.patientDocumentsService.createAutomaticDocument(tenantId, {
        tenantId,
        patientId: dto.patientId,
        documentType: 'consent',
        fileUrl: uploadPdf.url,
        thumbnailUrl: null,
        fileName: `Consent_${template.procedureType.replace(/\s+/g, '_')}.pdf`,
        fileSize: pdfBuffer.length,
        mimeType: 'application/pdf',
        uploadedBy: patient.id, // Patient / Guardian
        description: `Signed consent form for ${template.procedureType} procedure`,
        tags: ['consent', template.procedureType.toLowerCase()],
        sourceId: consent.id,
        sourceType: 'consent',
      });
    } catch (err) {
      // Ignore indexing errors to maintain main action safety
    }

    return consent;
  }
}
