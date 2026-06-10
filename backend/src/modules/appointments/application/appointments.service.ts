import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IAppointmentsRepository } from '../domain/appointments.repository.interface';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from '../domain/appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject('IAppointmentsRepository')
    private readonly appointmentsRepository: IAppointmentsRepository,
  ) {}

  async create(tenantId: string, createDto: CreateAppointmentDto): Promise<Appointment> {
    const start = new Date(createDto.startTime);
    const end = new Date(createDto.endTime);

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }

    const hasOverlap = await this.appointmentsRepository.checkOverlap(
      tenantId,
      createDto.dentistId,
      start,
      end,
    );
    if (hasOverlap) {
      throw new BadRequestException('This dentist already has an overlapping appointment scheduled.');
    }

    return this.appointmentsRepository.create({
      tenantId,
      patientId: createDto.patientId,
      dentistId: createDto.dentistId,
      startTime: start,
      endTime: end,
      status: 'SCHEDULED',
      reason: createDto.reason,
      notes: createDto.notes || null,
    });
  }

  async findAll(tenantId: string, fromStr?: string, toStr?: string): Promise<any[]> {
    const fromDate = fromStr ? new Date(fromStr) : undefined;
    const toDate = toStr ? new Date(toStr) : undefined;
    return this.appointmentsRepository.findAll(tenantId, fromDate, toDate);
  }

  async findById(tenantId: string, id: string): Promise<Appointment> {
    const appt = await this.appointmentsRepository.findById(tenantId, id);
    if (!appt) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    return appt;
  }

  async update(tenantId: string, id: string, updateDto: UpdateAppointmentDto): Promise<Appointment> {
    const current = await this.findById(tenantId, id);

    const updateData: any = {};
    if (updateDto.dentistId) updateData.dentistId = updateDto.dentistId;
    if (updateDto.reason) updateData.reason = updateDto.reason;
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;

    const start = updateDto.startTime ? new Date(updateDto.startTime) : current.startTime;
    const end = updateDto.endTime ? new Date(updateDto.endTime) : current.endTime;

    if (updateDto.startTime || updateDto.endTime) {
      if (end <= start) {
        throw new BadRequestException('End time must be after start time');
      }
      updateData.startTime = start;
      updateData.endTime = end;
    }

    const checkDentist = updateDto.dentistId || current.dentistId;
    const hasOverlap = await this.appointmentsRepository.checkOverlap(
      tenantId,
      checkDentist,
      start,
      end,
      id,
    );
    if (hasOverlap) {
      throw new BadRequestException('This dentist already has an overlapping appointment scheduled.');
    }

    return this.appointmentsRepository.update(tenantId, id, updateData);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  ): Promise<Appointment> {
    await this.findById(tenantId, id);
    return this.appointmentsRepository.updateStatus(tenantId, id, status);
  }
}
