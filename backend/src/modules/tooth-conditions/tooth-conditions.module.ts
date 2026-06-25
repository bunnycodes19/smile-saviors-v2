import { Module } from '@nestjs/common';
import { ToothConditionsService } from './application/tooth-conditions.service';
import { ToothConditionsController } from './presentation/tooth-conditions.controller';
import { ToothConditionsRepositoryImpl } from './infrastructure/tooth-conditions.repository.impl';

@Module({
  controllers: [ToothConditionsController],
  providers: [
    ToothConditionsService,
    {
      provide: 'IToothConditionsRepository',
      useClass: ToothConditionsRepositoryImpl,
    },
  ],
  exports: [ToothConditionsService, 'IToothConditionsRepository'],
})
export class ToothConditionsModule {}
