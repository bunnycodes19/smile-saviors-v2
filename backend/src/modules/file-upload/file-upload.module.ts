import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileUploadService } from './application/file-upload.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'IFileUploadService',
      useClass: FileUploadService,
    },
  ],
  exports: ['IFileUploadService'],
})
export class FileUploadModule {}
