import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, or, ilike } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IPatientsRepository } from '../domain/patients.repository.interface';
import { Patient } from '../domain/patient.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class PatientsRepositoryImpl implements IPatientsRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async create(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const [row] = await this.db
      .insert(schema.patients)
      .values({
        tenantId: patientData.tenantId,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        dob: patientData.dob,
        gender: patientData.gender,
        phone: patientData.phone,
        email: patientData.email,
        address: patientData.address,
        medicalHistory: patientData.medicalHistory,
        allergies: patientData.allergies,
      })
      .returning();

    return this.mapToEntity(row);
  }

  async findAll(tenantId: string, search?: string): Promise<Patient[]> {
    let whereClause = eq(schema.patients.tenantId, tenantId);

    if (search) {
      const searchPattern = `%${search}%`;
      whereClause = and(
        whereClause,
        or(
          ilike(schema.patients.firstName, searchPattern),
          ilike(schema.patients.lastName, searchPattern),
          ilike(schema.patients.phone, searchPattern),
        ),
      ) as any;
    }

    const rows = await this.db.select().from(schema.patients).where(whereClause).orderBy(schema.patients.createdAt);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findById(tenantId: string, id: string): Promise<Patient | null> {
    const rows = await this.db
      .select()
      .from(schema.patients)
      .where(and(eq(schema.patients.tenantId, tenantId), eq(schema.patients.id, id)))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  async update(
    tenantId: string,
    id: string,
    patientData: Partial<Omit<Patient, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Patient> {
    const [row] = await this.db
      .update(schema.patients)
      .set({
        ...patientData,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.patients.tenantId, tenantId), eq(schema.patients.id, id)))
      .returning();

    if (!row) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return this.mapToEntity(row);
  }

  private mapToEntity(row: any): Patient {
    return new Patient(
      row.id,
      row.tenantId,
      row.firstName,
      row.lastName,
      row.dob,
      row.gender,
      row.phone,
      row.email,
      row.address,
      (row.medicalHistory as string[]) || [],
      (row.allergies as string[]) || [],
      row.createdAt,
      row.updatedAt,
    );
  }
}
