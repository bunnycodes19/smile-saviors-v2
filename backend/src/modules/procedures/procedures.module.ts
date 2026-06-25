import { Module } from '@nestjs/common';
import { ProceduresService } from './application/procedures.service';
import { ProceduresController } from './presentation/procedures.controller';
import { ProceduresRepositoryImpl } from './infrastructure/procedures.repository.impl';

@Module({
  controllers: [ProceduresController],
  providers: [
    ProceduresService,
    {
      provide: 'IProceduresRepository',
      useClass: ProceduresRepositoryImpl,
    },
  ],
  exports: [ProceduresService, 'IProceduresRepository'],
})
export class ProceduresModule {}
