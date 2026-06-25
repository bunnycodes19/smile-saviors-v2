import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PrescriptionsService } from '../application/prescriptions.service';
import { CreatePrescriptionDto } from '../application/dto/create-prescription.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles('DENTIST', 'ADMIN')
  async create(@CurrentUser() user: UserContext, @Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(user.tenantId, user.userId, dto);
  }

  @Get('patient/:patientId')
  async findAllByPatient(@CurrentUser() user: UserContext, @Param('patientId') patientId: string) {
    return this.prescriptionsService.findAllByPatient(user.tenantId, patientId);
  }

  @Get(':id')
  async findById(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.prescriptionsService.findById(user.tenantId, id);
  }

  @Delete(':id')
  @Roles('DENTIST', 'ADMIN')
  async delete(@CurrentUser() user: UserContext, @Param('id') id: string) {
    await this.prescriptionsService.delete(user.tenantId, id);
    return { success: true };
  }
}
