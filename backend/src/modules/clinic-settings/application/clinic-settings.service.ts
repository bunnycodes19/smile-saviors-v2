import { Injectable, Inject } from '@nestjs/common';
import { IClinicSettingsRepository } from '../domain/clinic-settings.repository.interface';
import { ClinicSetting } from '../domain/clinic-setting.entity';
import { UpdateClinicSettingsDto } from './dto/update-clinic-settings.dto';

@Injectable()
export class ClinicSettingsService {
  constructor(
    @Inject('IClinicSettingsRepository')
    private readonly settingsRepository: IClinicSettingsRepository,
  ) {}

  async getSettings(tenantId: string): Promise<ClinicSetting> {
    let settings = await this.settingsRepository.findSettingsByTenant(tenantId);
    if (!settings) {
      // Create default settings if not exists
      settings = await this.settingsRepository.createSettings(tenantId, {
        tenantId,
        toothNumbering: 'fdi',
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
      });
    }
    return settings;
  }

  async updateSettings(tenantId: string, dto: UpdateClinicSettingsDto): Promise<ClinicSetting> {
    // Ensure settings exist first
    await this.getSettings(tenantId);
    return this.settingsRepository.updateSettings(tenantId, dto);
  }
}
