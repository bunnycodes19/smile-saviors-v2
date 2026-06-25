import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { TreatmentsService } from '../application/treatments.service';
import { CreateTreatmentDto } from '../application/dto/create-treatment.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  @Post('treatments')
  @Roles('DENTIST', 'ADMIN')
  async create(@CurrentUser() user: UserContext, @Body() createDto: CreateTreatmentDto) {
    return this.treatmentsService.create(user.tenantId, user.userId, createDto);
  }

  @Get('patients/:patientId/treatments')
  async findByPatientId(@CurrentUser() user: UserContext, @Param('patientId') patientId: string) {
    return this.treatmentsService.findByPatientId(user.tenantId, patientId);
  }

  @Post('treatments/plan')
  @Roles('DENTIST', 'ADMIN')
  async createTreatmentPlan(
    @CurrentUser() user: UserContext,
    @Body() body: { patientId: string; items: Omit<CreateTreatmentDto, 'patientId'>[] },
  ) {
    return this.treatmentsService.createTreatmentPlan(user.tenantId, user.userId, body.patientId, body.items);
  }

  @Patch('treatments/:id/accept')
  async accept(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.treatmentsService.acceptTreatment(user.tenantId, id);
  }

  @Patch('treatments/:id/complete')
  @Roles('DENTIST', 'ADMIN')
  async complete(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() body: { price?: string; clinicalNotes?: string },
  ) {
    return this.treatmentsService.completeTreatment(user.tenantId, id, body.price, body.clinicalNotes);
  }

  @Patch('treatments/:id/cancel')
  async cancel(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.treatmentsService.cancelTreatment(user.tenantId, id);
  }
}
