import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PatientsService } from '../application/patients.service';
import { CreatePatientDto } from '../application/dto/create-patient.dto';
import { UpdatePatientDto } from '../application/dto/update-patient.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  async create(@CurrentUser() user: UserContext, @Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(user.tenantId, createPatientDto);
  }

  @Get()
  async findAll(@CurrentUser() user: UserContext, @Query('search') search?: string) {
    return this.patientsService.findAll(user.tenantId, search);
  }

  @Get(':id')
  async findById(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.patientsService.findById(user.tenantId, id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(user.tenantId, id, updatePatientDto);
  }
}
