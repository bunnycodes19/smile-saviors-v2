import { Module, Global } from '@nestjs/common';
import { PdfGenerationService } from './application/pdf-generation.service';

@Global()
@Module({
  providers: [
    {
      provide: 'IPdfGenerationService',
      useClass: PdfGenerationService,
    },
  ],
  exports: ['IPdfGenerationService'],
})
export class PdfGenerationModule {}
