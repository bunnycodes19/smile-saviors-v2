import { Injectable, Inject } from '@nestjs/common';
import { IToothConditionsRepository } from '../domain/tooth-conditions.repository.interface';
import { CreateToothConditionDto } from './dto/create-tooth-condition.dto';
import { UpdateToothConditionDto } from './dto/update-tooth-condition.dto';
import { ToothCondition } from '../domain/tooth-condition.entity';

@Injectable()
export class ToothConditionsService {
  constructor(
    @Inject('IToothConditionsRepository')
    private readonly toothConditionsRepository: IToothConditionsRepository,
  ) {}

  async create(tenantId: string, dto: CreateToothConditionDto): Promise<ToothCondition> {
    return this.toothConditionsRepository.create({
      tenantId,
      patientId: dto.patientId,
      toothNumber: dto.toothNumber,
      surface: dto.surface || null,
      conditionCode: dto.conditionCode,
      status: dto.status,
      dateRecorded: dto.dateRecorded ? new Date(dto.dateRecorded) : new Date(),
      visitId: dto.visitId || null,
      dentistId: dto.dentistId || null,
      notes: dto.notes || null,
    });
  }

  async findAllByPatient(tenantId: string, patientId: string, asOfDate?: string): Promise<ToothCondition[]> {
    return this.toothConditionsRepository.findAllByPatient(tenantId, patientId, asOfDate);
  }

  async findByTooth(tenantId: string, patientId: string, toothNumber: string): Promise<ToothCondition[]> {
    return this.toothConditionsRepository.findByTooth(tenantId, patientId, toothNumber);
  }

  async update(tenantId: string, id: string, dto: UpdateToothConditionDto): Promise<ToothCondition> {
    const updateData: any = { ...dto };
    if (dto.dateRecorded) {
      updateData.dateRecorded = new Date(dto.dateRecorded);
    }
    return this.toothConditionsRepository.update(tenantId, id, updateData);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    return this.toothConditionsRepository.delete(tenantId, id);
  }
}
