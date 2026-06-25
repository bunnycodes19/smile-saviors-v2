import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConsentsService } from '../application/consents.service';
import { CreateConsentDto } from '../application/dto/create-consent.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('consents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentsController {
  constructor(private readonly consentsService: ConsentsService) {}

  @Get('templates')
  async getTemplates(@CurrentUser() user: UserContext) {
    return this.consentsService.getTemplates(user.tenantId);
  }

  @Post('templates')
  async createTemplate(
    @CurrentUser() user: UserContext,
    @Body() dto: { procedureType: string; title: string; legalText: string; requiresGuardian: boolean }
  ) {
    return this.consentsService.createTemplate(user.tenantId, dto);
  }

  @Get('patient/:patientId')
  async getConsentsByPatient(@CurrentUser() user: UserContext, @Param('patientId') patientId: string) {
    return this.consentsService.getConsentsByPatient(user.tenantId, patientId);
  }

  @Post()
  async createConsent(@CurrentUser() user: UserContext, @Body() dto: CreateConsentDto) {
    return this.consentsService.createConsent(user.tenantId, dto);
  }
}
