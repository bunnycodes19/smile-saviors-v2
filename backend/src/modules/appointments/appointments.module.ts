import { Module } from '@nestjs/common';
import { AppointmentsService } from './application/appointments.service';
import { AppointmentsController } from './presentation/appointments.controller';
import { AppointmentsRepositoryImpl } from './infrastructure/appointments.repository.impl';

@Module({
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    {
      provide: 'IAppointmentsRepository',
      useClass: AppointmentsRepositoryImpl,
    },
  ],
  exports: [AppointmentsService, 'IAppointmentsRepository'],
})
export class AppointmentsModule {}
