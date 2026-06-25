import { Module } from '@nestjs/common';
import { ClinicSettingsService } from './application/clinic-settings.service';
import { ClinicSettingsController } from './presentation/clinic-settings.controller';
import { ClinicSettingsRepositoryImpl } from './infrastructure/clinic-settings.repository.impl';

@Module({
  controllers: [ClinicSettingsController],
  providers: [
    ClinicSettingsService,
    {
      provide: 'IClinicSettingsRepository',
      useClass: ClinicSettingsRepositoryImpl,
    },
  ],
  exports: [ClinicSettingsService, 'IClinicSettingsRepository'],
})
export class ClinicSettingsModule {}
