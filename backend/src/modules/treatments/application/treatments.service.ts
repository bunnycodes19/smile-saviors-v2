import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITreatmentsRepository } from '../domain/treatments.repository.interface';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { Treatment } from '../domain/treatment.entity';

@Injectable()
export class TreatmentsService {
  constructor(
    @Inject('ITreatmentsRepository')
    private readonly treatmentsRepository: ITreatmentsRepository,
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
      status: createDto.status,
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
}
