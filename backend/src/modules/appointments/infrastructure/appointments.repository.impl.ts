import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, gte, lte } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IAppointmentsRepository } from '../domain/appointments.repository.interface';
import { Appointment } from '../domain/appointment.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class AppointmentsRepositoryImpl implements IAppointmentsRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async create(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const [row] = await this.db
      .insert(schema.appointments)
      .values({
        tenantId: appointmentData.tenantId,
        patientId: appointmentData.patientId,
        dentistId: appointmentData.dentistId,
        startTime: appointmentData.startTime,
        endTime: appointmentData.endTime,
        status: appointmentData.status,
        reason: appointmentData.reason,
        notes: appointmentData.notes,
      })
      .returning();

    return this.mapToEntity(row);
  }

  async findAll(tenantId: string, fromDate?: Date, toDate?: Date): Promise<any[]> {
    let whereClause = eq(schema.appointments.tenantId, tenantId);

    if (fromDate) {
      whereClause = and(whereClause, gte(schema.appointments.startTime, fromDate)) as any;
    }
    if (toDate) {
      whereClause = and(whereClause, lte(schema.appointments.endTime, toDate)) as any;
    }

    const rows = await this.db
      .select({
        id: schema.appointments.id,
        tenantId: schema.appointments.tenantId,
        patientId: schema.appointments.patientId,
        dentistId: schema.appointments.dentistId,
        startTime: schema.appointments.startTime,
        endTime: schema.appointments.endTime,
        status: schema.appointments.status,
        reason: schema.appointments.reason,
        notes: schema.appointments.notes,
        createdAt: schema.appointments.createdAt,
        updatedAt: schema.appointments.updatedAt,
        patientFirstName: schema.patients.firstName,
        patientLastName: schema.patients.lastName,
        patientPhone: schema.patients.phone,
        dentistFirstName: schema.users.firstName,
        dentistLastName: schema.users.lastName,
      })
      .from(schema.appointments)
      .leftJoin(schema.patients, eq(schema.appointments.patientId, schema.patients.id))
      .leftJoin(schema.users, eq(schema.appointments.dentistId, schema.users.id))
      .where(whereClause)
      .orderBy(schema.appointments.startTime);

    return rows;
  }

  async findById(tenantId: string, id: string): Promise<Appointment | null> {
    const rows = await this.db
      .select()
      .from(schema.appointments)
      .where(and(eq(schema.appointments.tenantId, tenantId), eq(schema.appointments.id, id)))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  async update(
    tenantId: string,
    id: string,
    appointmentData: Partial<Omit<Appointment, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Appointment> {
    const [row] = await this.db
      .update(schema.appointments)
      .set({
        ...appointmentData,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.appointments.tenantId, tenantId), eq(schema.appointments.id, id)))
      .returning();

    if (!row) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return this.mapToEntity(row);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  ): Promise<Appointment> {
    const [row] = await this.db
      .update(schema.appointments)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.appointments.tenantId, tenantId), eq(schema.appointments.id, id)))
      .returning();

    if (!row) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return this.mapToEntity(row);
  }

  private mapToEntity(row: any): Appointment {
    return new Appointment(
      row.id,
      row.tenantId,
      row.patientId,
      row.dentistId,
      row.startTime,
      row.endTime,
      row.status as any,
      row.reason,
      row.notes,
      row.createdAt,
      row.updatedAt,
    );
  }
}
