import { Appointment } from './appointment.entity';

export interface IAppointmentsRepository {
  create(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment>;
  findAll(tenantId: string, fromDate?: Date, toDate?: Date): Promise<Appointment[]>;
  findById(tenantId: string, id: string): Promise<Appointment | null>;
  update(
    tenantId: string,
    id: string,
    appointmentData: Partial<Omit<Appointment, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Appointment>;
  updateStatus(
    tenantId: string,
    id: string,
    status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  ): Promise<Appointment>;
  checkOverlap(
    tenantId: string,
    dentistId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<boolean>;
}
