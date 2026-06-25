import { ClinicSetting } from './clinic-setting.entity';

export interface IClinicSettingsRepository {
  findSettingsByTenant(tenantId: string): Promise<ClinicSetting | null>;
  createSettings(tenantId: string, settings: Omit<ClinicSetting, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClinicSetting>;
  updateSettings(tenantId: string, data: Partial<Omit<ClinicSetting, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<ClinicSetting>;
}
