import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ProceduresService } from '../application/procedures.service';
import { CreateProcedureDto } from '../application/dto/create-procedure.dto';
import { CreateProcedureStepDto } from '../application/dto/create-procedure-step.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('procedures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  @Post()
  @Roles('DENTIST', 'ADMIN')
  async create(@CurrentUser() user: UserContext, @Body() dto: CreateProcedureDto) {
    return this.proceduresService.createProcedure(user.tenantId, dto);
  }

  @Get('patient/:patientId')
  async findByPatient(@CurrentUser() user: UserContext, @Param('patientId') patientId: string) {
    return this.proceduresService.findProceduresByPatient(user.tenantId, patientId);
  }

  @Put(':id')
  @Roles('DENTIST', 'ADMIN')
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: Partial<CreateProcedureDto> & { status?: string },
  ) {
    return this.proceduresService.updateProcedure(user.tenantId, id, dto);
  }

  @Get(':id/steps')
  async findSteps(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.proceduresService.findStepsByProcedure(user.tenantId, id);
  }

  @Post(':id/steps')
  @Roles('DENTIST', 'ADMIN')
  async createStep(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: CreateProcedureStepDto,
  ) {
    return this.proceduresService.createStep(user.tenantId, id, user.userId, dto);
  }

  @Put('steps/:stepId')
  @Roles('DENTIST', 'ADMIN')
  async updateStep(
    @CurrentUser() user: UserContext,
    @Param('stepId') stepId: string,
    @Body() dto: Partial<CreateProcedureStepDto>,
  ) {
    return this.proceduresService.updateStep(user.tenantId, stepId, dto);
  }
}
