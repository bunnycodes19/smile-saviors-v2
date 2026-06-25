import { Module } from '@nestjs/common';
import { RadiographsService } from './application/radiographs.service';
import { RadiographsController } from './presentation/radiographs.controller';
import { RadiographsRepositoryImpl } from './infrastructure/radiographs.repository.impl';

@Module({
  controllers: [RadiographsController],
  providers: [
    RadiographsService,
    {
      provide: 'IRadiographsRepository',
      useClass: RadiographsRepositoryImpl,
    },
  ],
  exports: [RadiographsService, 'IRadiographsRepository'],
})
export class RadiographsModule {}
