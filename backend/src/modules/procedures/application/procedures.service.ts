import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IProceduresRepository } from '../domain/procedures.repository.interface';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { CreateProcedureStepDto } from './dto/create-procedure-step.dto';
import { Procedure } from '../domain/procedure.entity';
import { ProcedureStep } from '../domain/procedure-step.entity';

@Injectable()
export class ProceduresService {
  constructor(
    @Inject('IProceduresRepository')
    private readonly proceduresRepository: IProceduresRepository,
  ) {}

  async createProcedure(tenantId: string, dto: CreateProcedureDto): Promise<Procedure> {
    return this.proceduresRepository.createProcedure({
      tenantId,
      patientId: dto.patientId,
      toothNumber: dto.toothNumber || null,
      procedureType: dto.procedureType,
      status: 'in_progress',
      startDate: new Date(dto.startDate),
      expectedSittings: dto.expectedSittings || null,
      totalCost: dto.totalCost || null,
      notes: dto.notes || null,
    });
  }

  async findProceduresByPatient(tenantId: string, patientId: string): Promise<Procedure[]> {
    return this.proceduresRepository.findProceduresByPatient(tenantId, patientId);
  }

  async findProcedureById(tenantId: string, id: string): Promise<Procedure> {
    const procedure = await this.proceduresRepository.findProcedureById(tenantId, id);
    if (!procedure) {
      throw new NotFoundException(`Procedure with ID ${id} not found`);
    }
    return procedure;
  }

  async updateProcedure(
    tenantId: string,
    id: string,
    dto: Partial<CreateProcedureDto> & { status?: string },
  ): Promise<Procedure> {
    const updateData: any = {};
    if (dto.toothNumber !== undefined) updateData.toothNumber = dto.toothNumber;
    if (dto.procedureType !== undefined) updateData.procedureType = dto.procedureType;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.expectedSittings !== undefined) updateData.expectedSittings = dto.expectedSittings;
    if (dto.totalCost !== undefined) updateData.totalCost = dto.totalCost;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    return this.proceduresRepository.updateProcedure(tenantId, id, updateData);
  }

  async createStep(
    tenantId: string,
    procedureId: string,
    dentistId: string,
    dto: CreateProcedureStepDto,
  ): Promise<ProcedureStep> {
    await this.findProcedureById(tenantId, procedureId); // validation

    return this.proceduresRepository.createProcedureStep({
      tenantId,
      procedureId,
      visitId: dto.visitId || null,
      stepNumber: dto.stepNumber,
      stepDescription: dto.stepDescription,
      date: dto.date ? new Date(dto.date) : new Date(),
      dentistId,
      dentistNotes: dto.dentistNotes || null,
      costForStep: dto.costForStep || null,
      status: dto.status || 'completed',
    });
  }

  async findStepsByProcedure(tenantId: string, procedureId: string): Promise<ProcedureStep[]> {
    return this.proceduresRepository.findStepsByProcedure(tenantId, procedureId);
  }

  async updateStep(
    tenantId: string,
    id: string,
    dto: Partial<CreateProcedureStepDto> & { dentistId?: string },
  ): Promise<ProcedureStep> {
    const updateData: any = {};
    if (dto.visitId !== undefined) updateData.visitId = dto.visitId;
    if (dto.stepNumber !== undefined) updateData.stepNumber = dto.stepNumber;
    if (dto.stepDescription !== undefined) updateData.stepDescription = dto.stepDescription;
    if (dto.date !== undefined) updateData.date = dto.date ? new Date(dto.date) : null;
    if (dto.dentistNotes !== undefined) updateData.dentistNotes = dto.dentistNotes;
    if (dto.costForStep !== undefined) updateData.costForStep = dto.costForStep;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.dentistId !== undefined) updateData.dentistId = dto.dentistId;

    return this.proceduresRepository.updateProcedureStep(tenantId, id, updateData);
  }
}
