import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ToothConditionsService } from '../application/tooth-conditions.service';
import { CreateToothConditionDto } from '../application/dto/create-tooth-condition.dto';
import { UpdateToothConditionDto } from '../application/dto/update-tooth-condition.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('tooth-conditions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ToothConditionsController {
  constructor(private readonly toothConditionsService: ToothConditionsService) {}

  @Post()
  @Roles('DENTIST', 'ADMIN')
  async create(@CurrentUser() user: UserContext, @Body() createDto: CreateToothConditionDto) {
    return this.toothConditionsService.create(user.tenantId, createDto);
  }

  @Get('patient/:patientId')
  async findAllByPatient(
    @CurrentUser() user: UserContext,
    @Param('patientId') patientId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.toothConditionsService.findAllByPatient(user.tenantId, patientId, asOfDate);
  }

  @Get('patient/:patientId/tooth/:toothNumber')
  async findByTooth(
    @CurrentUser() user: UserContext,
    @Param('patientId') patientId: string,
    @Param('toothNumber') toothNumber: string,
  ) {
    return this.toothConditionsService.findByTooth(user.tenantId, patientId, toothNumber);
  }

  @Put(':id')
  @Roles('DENTIST', 'ADMIN')
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() updateDto: UpdateToothConditionDto,
  ) {
    return this.toothConditionsService.update(user.tenantId, id, updateDto);
  }

  @Delete(':id')
  @Roles('DENTIST', 'ADMIN')
  async delete(@CurrentUser() user: UserContext, @Param('id') id: string) {
    await this.toothConditionsService.delete(user.tenantId, id);
    return { success: true };
  }
}
