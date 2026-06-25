import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatientDocumentsService } from '../application/patient-documents.service';
import { CreateDocumentDto } from '../application/dto/create-document.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('patient-documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientDocumentsController {
  constructor(private readonly documentsService: PatientDocumentsService) {}

  @Post('upload')
  @Roles('ADMIN', 'DENTIST', 'RECEPTIONIST')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: UserContext,
    @UploadedFile() file: any,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentsService.uploadDocument(user.tenantId, dto, file, user.userId);
  }

  @Get('patient/:patientId')
  async getDocuments(
    @CurrentUser() user: UserContext,
    @Param('patientId') patientId: string,
    @Query('type') type?: string,
  ) {
    return this.documentsService.findDocumentsByPatient(user.tenantId, patientId, { type });
  }

  @Delete(':id')
  @Roles('ADMIN')
  async delete(@CurrentUser() user: UserContext, @Param('id') id: string) {
    await this.documentsService.deleteDocument(user.tenantId, id);
    return { success: true };
  }
}
