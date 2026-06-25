import { Module } from '@nestjs/common';
import { RecallsService } from './application/recalls.service';
import { RecallsController } from './presentation/recalls.controller';
import { RecallsRepositoryImpl } from './infrastructure/recalls.repository.impl';

@Module({
  controllers: [RecallsController],
  providers: [
    RecallsService,
    {
      provide: 'IRecallsRepository',
      useClass: RecallsRepositoryImpl,
    },
  ],
  exports: [RecallsService, 'IRecallsRepository'],
})
export class RecallsModule {}
