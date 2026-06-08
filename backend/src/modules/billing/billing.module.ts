import { Module } from '@nestjs/common';
import { BillingService } from './application/billing.service';
import { BillingController } from './presentation/billing.controller';
import { BillingRepositoryImpl } from './infrastructure/billing.repository.impl';

@Module({
  controllers: [BillingController],
  providers: [
    BillingService,
    {
      provide: 'IBillingRepository',
      useClass: BillingRepositoryImpl,
    },
  ],
  exports: [BillingService, 'IBillingRepository'],
})
export class BillingModule {}
