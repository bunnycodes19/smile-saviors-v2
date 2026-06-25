import { Module } from '@nestjs/common';
import { LabOrdersService } from './application/lab-orders.service';
import { LabOrdersController } from './presentation/lab-orders.controller';
import { LabOrdersRepositoryImpl } from './infrastructure/lab-orders.repository.impl';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [LabOrdersController],
  providers: [
    LabOrdersService,
    {
      provide: 'ILabOrdersRepository',
      useClass: LabOrdersRepositoryImpl,
    },
  ],
  exports: [LabOrdersService, 'ILabOrdersRepository'],
})
export class LabOrdersModule {}
