import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, like } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IRadiographsRepository } from '../domain/radiographs.repository.interface';
import { Radiograph } from '../domain/radiograph.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class RadiographsRepositoryImpl implements IRadiographsRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async create(radiographData: Omit<Radiograph, 'id' | 'createdAt'>): Promise<Radiograph> {
    const [row] = await this.db
      .insert(schema.radiographs)
      .values({
        tenantId: radiographData.tenantId,
        patientId: radiographData.patientId,
        imageType: radiographData.imageType,
        imageUrl: radiographData.imageUrl,
        thumbnailUrl: radiographData.thumbnailUrl,
        toothNumbers: radiographData.toothNumbers,
        takenDate: radiographData.takenDate ? radiographData.takenDate.toISOString().split('T')[0] : undefined,
        visitId: radiographData.visitId,
        uploadedBy: radiographData.uploadedBy,
        notes: radiographData.notes,
      })
      .returning();

    return this.mapToEntity(row);
  }

  async findAllByPatient(tenantId: string, patientId: string, imageType?: string): Promise<Radiograph[]> {
    let whereClause = and(
      eq(schema.radiographs.tenantId, tenantId),
      eq(schema.radiographs.patientId, patientId),
    );

    if (imageType) {
      whereClause = and(whereClause, eq(schema.radiographs.imageType, imageType)) as any;
    }

    const rows = await this.db
      .select()
      .from(schema.radiographs)
      .where(whereClause)
      .orderBy(schema.radiographs.takenDate);

    return rows.map((row) => this.mapToEntity(row));
  }

  async findByTooth(tenantId: string, patientId: string, toothNumber: string): Promise<Radiograph[]> {
    const rows = await this.db
      .select()
      .from(schema.radiographs)
      .where(
        and(
          eq(schema.radiographs.tenantId, tenantId),
          eq(schema.radiographs.patientId, patientId),
          like(schema.radiographs.toothNumbers, `%${toothNumber}%`),
        ),
      )
      .orderBy(schema.radiographs.takenDate);

    return rows.map((row) => this.mapToEntity(row));
  }

  async findById(tenantId: string, id: string): Promise<Radiograph | null> {
    const rows = await this.db
      .select()
      .from(schema.radiographs)
      .where(and(eq(schema.radiographs.tenantId, tenantId), eq(schema.radiographs.id, id)))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<Omit<Radiograph, 'id' | 'tenantId' | 'createdAt'>>,
  ): Promise<Radiograph> {
    const updateData: any = { ...data };
    if (data.takenDate) {
      updateData.takenDate = data.takenDate.toISOString().split('T')[0];
    }

    const [row] = await this.db
      .update(schema.radiographs)
      .set(updateData)
      .where(and(eq(schema.radiographs.tenantId, tenantId), eq(schema.radiographs.id, id)))
      .returning();

    if (!row) {
      throw new NotFoundException(`Radiograph record with ID ${id} not found`);
    }

    return this.mapToEntity(row);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.db
      .delete(schema.radiographs)
      .where(and(eq(schema.radiographs.tenantId, tenantId), eq(schema.radiographs.id, id)));
  }

  private mapToEntity(row: any): Radiograph {
    return new Radiograph(
      row.id,
      row.tenantId,
      row.patientId,
      row.imageType,
      row.imageUrl,
      row.thumbnailUrl,
      row.toothNumbers,
      row.takenDate ? new Date(row.takenDate) : null,
      row.visitId,
      row.uploadedBy,
      row.notes,
      row.createdAt,
    );
  }
}
