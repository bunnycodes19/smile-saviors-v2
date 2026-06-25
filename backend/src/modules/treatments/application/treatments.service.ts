import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ITreatmentsRepository } from '../domain/treatments.repository.interface';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { Treatment } from '../domain/treatment.entity';
import { RecallsService } from '../../recalls/application/recalls.service';
import { ConsentsService } from '../../consents/application/consents.service';

@Injectable()
export class TreatmentsService {
  constructor(
    @Inject('ITreatmentsRepository')
    private readonly treatmentsRepository: ITreatmentsRepository,
    private readonly recallsService: RecallsService,
    private readonly consentsService: ConsentsService,
  ) {}

  async create(tenantId: string, dentistId: string, createDto: CreateTreatmentDto): Promise<Treatment> {
    return this.treatmentsRepository.create({
      tenantId,
      patientId: createDto.patientId,
      dentistId,
      appointmentId: createDto.appointmentId || null,
      toothNumber: createDto.toothNumber !== undefined ? createDto.toothNumber : null,
      procedureName: createDto.procedureName,
      notes: createDto.notes || null,
      price: createDto.price,
      status: createDto.status === 'PLANNED' ? 'PROPOSED' : createDto.status, // normalise PLANNED -> PROPOSED
      chiefComplaint: createDto.chiefComplaint || null,
      symptoms: createDto.symptoms || null,
      diagnosis: createDto.diagnosis || null,
      followUpInstructions: createDto.followUpInstructions || null,
      clinicalNotes: createDto.clinicalNotes || null,
      estimatedCost: createDto.estimatedCost || createDto.price, // defaults to price
      acceptedAt: createDto.status === 'ACCEPTED' ? new Date() : null,
      completedAt: createDto.status === 'COMPLETED' ? new Date() : null,
      treatmentGroupId: createDto.treatmentGroupId || null,
    });
  }

  async findByPatientId(tenantId: string, patientId: string): Promise<Treatment[]> {
    return this.treatmentsRepository.findByPatientId(tenantId, patientId);
  }

  async findById(tenantId: string, id: string): Promise<Treatment> {
    const treatment = await this.treatmentsRepository.findById(tenantId, id);
    if (!treatment) {
      throw new NotFoundException(`Treatment with ID ${id} not found`);
    }
    return treatment;
  }

  async createTreatmentPlan(tenantId: string, dentistId: string, patientId: string, items: Omit<CreateTreatmentDto, 'patientId'>[]): Promise<Treatment[]> {
    const created: Treatment[] = [];
    for (const item of items) {
      const treatment = await this.create(tenantId, dentistId, {
        ...item,
        patientId,
      } as CreateTreatmentDto);
      created.push(treatment);
    }
    return created;
  }

  async acceptTreatment(tenantId: string, id: string): Promise<Treatment> {
    const treatment = await this.findById(tenantId, id);
    return this.treatmentsRepository.update(tenantId, id, {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    });
  }

  async completeTreatment(tenantId: string, id: string, actualPrice?: string, clinicalNotes?: string): Promise<Treatment> {
    const treatment = await this.findById(tenantId, id);

    // Consent guardrail for surgical procedures
    const surgicalProcedures = ['Tooth Extraction', 'Root Canal treatment', 'Dental Crown', 'Dental Implant'];
    if (surgicalProcedures.includes(treatment.procedureName)) {
      const consentExists = await this.consentsService.checkConsentForTreatment(tenantId, id);
      if (!consentExists) {
        throw new BadRequestException(`Signed consent required before completing this procedure: ${treatment.procedureName}`);
      }
    }

    const updateData: any = {
      status: 'COMPLETED',
      completedAt: new Date(),
    };
    if (actualPrice) {
      updateData.price = actualPrice;
    }
    if (clinicalNotes) {
      updateData.clinicalNotes = clinicalNotes;
    }
    
    const updated = await this.treatmentsRepository.update(tenantId, id, updateData);

    // Trigger recall check
    await this.recallsService.createScheduleFromTreatment(tenantId, updated);

    return updated;
  }

  async cancelTreatment(tenantId: string, id: string): Promise<Treatment> {
    const treatment = await this.findById(tenantId, id);
    return this.treatmentsRepository.update(tenantId, id, {
      status: 'CANCELLED',
    });
  }
}
