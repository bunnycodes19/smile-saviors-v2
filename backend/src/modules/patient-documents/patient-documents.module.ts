import { Module, Global } from '@nestjs/common';
import { PatientDocumentsService } from './application/patient-documents.service';
import { PatientDocumentsController } from './presentation/patient-documents.controller';
import { PatientDocumentsRepositoryImpl } from './infrastructure/patient-documents.repository.impl';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Global()
@Module({
  imports: [FileUploadModule],
  controllers: [PatientDocumentsController],
  providers: [
    PatientDocumentsService,
    {
      provide: 'IPatientDocumentsRepository',
      useClass: PatientDocumentsRepositoryImpl,
    },
  ],
  exports: [PatientDocumentsService, 'IPatientDocumentsRepository'],
})
export class PatientDocumentsModule {}
