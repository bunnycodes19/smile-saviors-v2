import { Module } from '@nestjs/common';
import { PatientsService } from './application/patients.service';
import { PatientsController } from './presentation/patients.controller';
import { PatientsRepositoryImpl } from './infrastructure/patients.repository.impl';

@Module({
  controllers: [PatientsController],
  providers: [
    PatientsService,
    {
      provide: 'IPatientsRepository',
      useClass: PatientsRepositoryImpl,
    },
  ],
  exports: [PatientsService, 'IPatientsRepository'],
})
export class PatientsModule {}
