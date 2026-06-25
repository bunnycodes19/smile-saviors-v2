import { Module } from '@nestjs/common';
import { ConsentsService } from './application/consents.service';
import { ConsentsController } from './presentation/consents.controller';
import { ConsentsRepositoryImpl } from './infrastructure/consents.repository.impl';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [PatientsModule],
  controllers: [ConsentsController],
  providers: [
    ConsentsService,
    {
      provide: 'IConsentsRepository',
      useClass: ConsentsRepositoryImpl,
    },
  ],
  exports: [ConsentsService, 'IConsentsRepository'],
})
export class ConsentsModule {}
