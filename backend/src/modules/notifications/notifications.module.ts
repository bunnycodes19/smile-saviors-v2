import { Module, Global } from '@nestjs/common';
import { NotificationService } from './application/notification.service';

@Global()
@Module({
  providers: [
    {
      provide: 'INotificationService',
      useClass: NotificationService,
    },
  ],
  exports: ['INotificationService'],
})
export class NotificationsModule {}
