import { Injectable, Inject } from '@nestjs/common';
import { IRadiographsRepository } from '../domain/radiographs.repository.interface';
import { IFileUploadService } from '../../file-upload/domain/file-upload.interface';
import { CreateRadiographDto } from './dto/create-radiograph.dto';
import { Radiograph } from '../domain/radiograph.entity';
import { PatientDocumentsService } from '../../patient-documents/application/patient-documents.service';

@Injectable()
export class RadiographsService {
  constructor(
    @Inject('IRadiographsRepository')
    private readonly radiographsRepository: IRadiographsRepository,
    @Inject('IFileUploadService')
    private readonly fileUploadService: IFileUploadService,
    private readonly patientDocumentsService: PatientDocumentsService,
  ) {}

  async uploadRadiograph(
    tenantId: string,
    userId: string,
    file: any,
    dto: CreateRadiographDto,
  ): Promise<Radiograph> {
    // 1. Upload file using the shared upload service
    const uploadResult = await this.fileUploadService.upload(file, 'radiographs');

    // 2. Save metadata in the database
    const radiograph = await this.radiographsRepository.create({
      tenantId,
      patientId: dto.patientId,
      imageType: dto.imageType,
      imageUrl: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl || null,
      toothNumbers: dto.toothNumbers || null,
      takenDate: dto.takenDate ? new Date(dto.takenDate) : new Date(),
      visitId: dto.visitId || null,
      uploadedBy: userId,
      notes: dto.notes || null,
    });

    // 3. Auto-register in document vault
    try {
      await this.patientDocumentsService.createAutomaticDocument(tenantId, {
        tenantId,
        patientId: dto.patientId,
        documentType: 'radiograph',
        fileUrl: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl || null,
        fileName: file.originalname || 'Radiograph.png',
        fileSize: file.size || null,
        mimeType: file.mimetype || 'image/png',
        uploadedBy: userId,
        description: dto.notes || `Radiograph of type ${dto.imageType}`,
        tags: dto.toothNumbers ? dto.toothNumbers.split(',').map(t => `tooth-${t.trim()}`) : [],
        sourceId: radiograph.id,
        sourceType: 'radiograph',
      });
    } catch (err) {
      // Ignore document indexing errors to keep operations robust
    }

    return radiograph;
  }

  async findAllByPatient(tenantId: string, patientId: string, imageType?: string): Promise<Radiograph[]> {
    return this.radiographsRepository.findAllByPatient(tenantId, patientId, imageType);
  }

  async findByTooth(tenantId: string, patientId: string, toothNumber: string): Promise<Radiograph[]> {
    return this.radiographsRepository.findByTooth(tenantId, patientId, toothNumber);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const record = await this.radiographsRepository.findById(tenantId, id);
    if (record) {
      // Pass the imageUrl directly; our FileUploadService is robust enough to delete by URL
      await this.fileUploadService.delete(record.imageUrl);
    }
    return this.radiographsRepository.delete(tenantId, id);
  }
}
