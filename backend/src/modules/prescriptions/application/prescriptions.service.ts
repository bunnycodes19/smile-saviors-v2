import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPrescriptionsRepository } from '../domain/prescriptions.repository.interface';
import { IPdfGenerationService } from '../../pdf-generation/domain/pdf-generation.interface';
import { IFileUploadService } from '../../file-upload/domain/file-upload.interface';
import { PatientsService } from '../../patients/application/patients.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { Prescription } from '../domain/prescription.entity';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import * as schema from '../../../infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';
import { PatientDocumentsService } from '../../patient-documents/application/patient-documents.service';

@Injectable()
export class PrescriptionsService {
  constructor(
    @Inject('IPrescriptionsRepository')
    private readonly prescriptionsRepository: IPrescriptionsRepository,
    @Inject('IPdfGenerationService')
    private readonly pdfGenerationService: IPdfGenerationService,
    @Inject('IFileUploadService')
    private readonly fileUploadService: IFileUploadService,
    private readonly patientsService: PatientsService,
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
    private readonly patientDocumentsService: PatientDocumentsService,
  ) {}

  async create(tenantId: string, dentistId: string, dto: CreatePrescriptionDto): Promise<Prescription> {
    // 1. Fetch Patient profile
    const patient = await this.patientsService.findById(tenantId, dto.patientId);
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${dto.patientId} not found`);
    }

    // 2. Fetch Dentist profile
    const dentistRows = await this.db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.tenantId, tenantId), eq(schema.users.id, dentistId)))
      .limit(1);
    
    if (dentistRows.length === 0) {
      throw new NotFoundException(`Dentist with ID ${dentistId} not found`);
    }
    const dentist = dentistRows[0];

    // 3. Create the database record
    const dateObj = new Date();
    const rx = await this.prescriptionsRepository.create(
      {
        tenantId,
        patientId: dto.patientId,
        visitId: dto.visitId || null,
        dentistId,
        date: dateObj,
        pdfUrl: null,
      },
      dto.items.map((item) => ({
        drugName: item.drugName,
        dosage: item.dosage || null,
        frequency: item.frequency || null,
        durationDays: item.durationDays !== undefined ? item.durationDays : null,
        instructions: item.instructions || null,
      })),
    );

    // 4. Generate the PDF
    const patientAge = dateObj.getFullYear() - new Date(patient.dob).getFullYear();
    const pdfBuffer = await this.pdfGenerationService.generatePrescription({
      clinicName: 'Smile Saviours Dental Clinic',
      dentistName: `${dentist.firstName} ${dentist.lastName}`,
      dentistRole: dentist.role === 'DENTIST' ? 'Dental Surgeon' : 'Clinical Administrator',
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientAge,
      patientGender: patient.gender,
      date: dateObj.toLocaleDateString(),
      items: rx.items,
    });

    // 5. Upload PDF
    const mockFile = {
      buffer: pdfBuffer,
      originalname: `prescription_${rx.id}.pdf`,
    };
    const uploadResult = await this.fileUploadService.upload(mockFile, 'prescriptions');

    // 6. Link PDF url to record
    await this.prescriptionsRepository.updatePdfUrl(tenantId, rx.id, uploadResult.url);

    // 7. Auto-register in document vault
    try {
      await this.patientDocumentsService.createAutomaticDocument(tenantId, {
        tenantId,
        patientId: dto.patientId,
        documentType: 'prescription',
        fileUrl: uploadResult.url,
        thumbnailUrl: null,
        fileName: `Prescription_${rx.id}.pdf`,
        fileSize: pdfBuffer.length,
        mimeType: 'application/pdf',
        uploadedBy: dentistId,
        description: `Prescription issued on ${dateObj.toLocaleDateString()}`,
        tags: ['prescription'],
        sourceId: rx.id,
        sourceType: 'prescription',
      });
    } catch (err) {
      // Ignore document indexing errors to keep operations robust
    }

    // Return the updated prescription entity with pdf url
    return new Prescription(
      rx.id,
      rx.tenantId,
      rx.patientId,
      rx.visitId,
      rx.dentistId,
      rx.date,
      uploadResult.url,
      rx.createdAt,
      rx.items,
    );
  }

  async findAllByPatient(tenantId: string, patientId: string): Promise<Prescription[]> {
    return this.prescriptionsRepository.findAllByPatient(tenantId, patientId);
  }

  async findById(tenantId: string, id: string): Promise<Prescription> {
    const rx = await this.prescriptionsRepository.findById(tenantId, id);
    if (!rx) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }
    return rx;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const rx = await this.prescriptionsRepository.findById(tenantId, id);
    if (rx && rx.pdfUrl) {
      await this.fileUploadService.delete(rx.pdfUrl);
    }
    return this.prescriptionsRepository.delete(tenantId, id);
  }
}
