import { Module } from '@nestjs/common';
import { DrugTemplatesService } from './application/drug-templates.service';
import { DrugTemplatesController } from './presentation/drug-templates.controller';
import { DrugTemplatesRepositoryImpl } from './infrastructure/drug-templates.repository.impl';

@Module({
  controllers: [DrugTemplatesController],
  providers: [
    DrugTemplatesService,
    {
      provide: 'IDrugTemplatesRepository',
      useClass: DrugTemplatesRepositoryImpl,
    },
  ],
  exports: [DrugTemplatesService, 'IDrugTemplatesRepository'],
})
export class DrugTemplatesModule {}
