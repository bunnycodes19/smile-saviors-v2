import { Module } from '@nestjs/common';
import { InventoryService } from './application/inventory.service';
import { InventoryController } from './presentation/inventory.controller';
import { InventoryRepositoryImpl } from './infrastructure/inventory.repository.impl';

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService,
    {
      provide: 'IInventoryRepository',
      useClass: InventoryRepositoryImpl,
    },
  ],
  exports: [InventoryService, 'IInventoryRepository'],
})
export class InventoryModule {}
