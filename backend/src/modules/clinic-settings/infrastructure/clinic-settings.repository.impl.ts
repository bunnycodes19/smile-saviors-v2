import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IClinicSettingsRepository } from '../domain/clinic-settings.repository.interface';
import { ClinicSetting } from '../domain/clinic-setting.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class ClinicSettingsRepositoryImpl implements IClinicSettingsRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async findSettingsByTenant(tenantId: string): Promise<ClinicSetting | null> {
    const [row] = await this.db
      .select()
      .from(schema.clinicSettings)
      .where(eq(schema.clinicSettings.tenantId, tenantId))
      .limit(1);
    return row ? this.mapToEntity(row) : null;
  }

  async createSettings(
    tenantId: string,
    settings: Omit<ClinicSetting, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ClinicSetting> {
    const [row] = await this.db
      .insert(schema.clinicSettings)
      .values({
        tenantId,
        toothNumbering: settings.toothNumbering,
        currency: settings.currency,
        dateFormat: settings.dateFormat,
      })
      .returning();
    return this.mapToEntity(row);
  }

  async updateSettings(
    tenantId: string,
    data: Partial<Omit<ClinicSetting, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<ClinicSetting> {
    const [row] = await this.db
      .update(schema.clinicSettings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.clinicSettings.tenantId, tenantId))
      .returning();
    return this.mapToEntity(row);
  }

  private mapToEntity(row: any): ClinicSetting {
    return new ClinicSetting(
      row.id,
      row.tenantId,
      row.toothNumbering,
      row.currency,
      row.dateFormat,
      row.createdAt,
      row.updatedAt,
    );
  }
}
