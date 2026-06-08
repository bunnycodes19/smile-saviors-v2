import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
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
}
