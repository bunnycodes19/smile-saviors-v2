import { Injectable, Inject } from '@nestjs/common';
import { eq, and, or, isNull } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IDrugTemplatesRepository } from '../domain/drug-templates.repository.interface';
import { DrugTemplate } from '../domain/drug-template.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class DrugTemplatesRepositoryImpl implements IDrugTemplatesRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async create(data: Omit<DrugTemplate, 'id' | 'createdAt'>): Promise<DrugTemplate> {
    const [row] = await this.db
      .insert(schema.drugTemplates)
      .values({
        tenantId: data.tenantId,
        name: data.name,
        genericName: data.genericName,
        category: data.category,
        defaultDosage: data.defaultDosage,
        defaultFrequency: data.defaultFrequency,
        defaultDuration: data.defaultDuration,
        defaultInstructions: data.defaultInstructions,
        contraindications: data.contraindications,
      })
      .returning();

    return this.mapToEntity(row);
  }

  async findAll(tenantId: string): Promise<DrugTemplate[]> {
    const rows = await this.db
      .select()
      .from(schema.drugTemplates)
      .where(
        or(
          eq(schema.drugTemplates.tenantId, tenantId),
          isNull(schema.drugTemplates.tenantId),
        ),
      )
      .orderBy(schema.drugTemplates.name);

    return rows.map((row) => this.mapToEntity(row));
  }

  async findById(tenantId: string, id: string): Promise<DrugTemplate | null> {
    const rows = await this.db
      .select()
      .from(schema.drugTemplates)
      .where(
        and(
          eq(schema.drugTemplates.id, id),
          or(
            eq(schema.drugTemplates.tenantId, tenantId),
            isNull(schema.drugTemplates.tenantId),
          ),
        ),
      )
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.db
      .delete(schema.drugTemplates)
      .where(
        and(
          eq(schema.drugTemplates.id, id),
          eq(schema.drugTemplates.tenantId, tenantId),
        ),
      );
  }

  private mapToEntity(row: any): DrugTemplate {
    return new DrugTemplate(
      row.id,
      row.tenantId,
      row.name,
      row.genericName,
      row.category,
      row.defaultDosage,
      row.defaultFrequency,
      row.defaultDuration,
      row.defaultInstructions,
      (row.contraindications as string[]) || [],
      row.createdAt,
    );
  }
}
