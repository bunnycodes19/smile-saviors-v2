import { Module } from '@nestjs/common';
import { PrescriptionsService } from './application/prescriptions.service';
import { PrescriptionsController } from './presentation/prescriptions.controller';
import { PrescriptionsRepositoryImpl } from './infrastructure/prescriptions.repository.impl';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [PatientsModule],
  controllers: [PrescriptionsController],
  providers: [
    PrescriptionsService,
    {
      provide: 'IPrescriptionsRepository',
      useClass: PrescriptionsRepositoryImpl,
    },
  ],
  exports: [PrescriptionsService, 'IPrescriptionsRepository'],
})
export class PrescriptionsModule {}
