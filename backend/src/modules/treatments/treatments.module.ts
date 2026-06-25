import { Module } from '@nestjs/common';
import { TreatmentsService } from './application/treatments.service';
import { TreatmentsController } from './presentation/treatments.controller';
import { TreatmentsRepositoryImpl } from './infrastructure/treatments.repository.impl';
import { RecallsModule } from '../recalls/recalls.module';
import { ConsentsModule } from '../consents/consents.module';

@Module({
  imports: [RecallsModule, ConsentsModule],
  controllers: [TreatmentsController],
  providers: [
    TreatmentsService,
    {
      provide: 'ITreatmentsRepository',
      useClass: TreatmentsRepositoryImpl,
    },
  ],
  exports: [TreatmentsService, 'ITreatmentsRepository'],
})
export class TreatmentsModule {}
