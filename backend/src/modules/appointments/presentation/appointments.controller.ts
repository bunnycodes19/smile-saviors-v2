import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from '../application/appointments.service';
import { CreateAppointmentDto } from '../application/dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../application/dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from '../application/dto/update-appointment-status.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  async create(@CurrentUser() user: UserContext, @Body() createDto: CreateAppointmentDto) {
    return this.appointmentsService.create(user.tenantId, createDto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: UserContext,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
  ) {
    return this.appointmentsService.findAll(user.tenantId, fromDate, toDate);
  }

  @Get(':id')
  async findById(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.appointmentsService.findById(user.tenantId, id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() updateDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(user.tenantId, id, updateDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() statusDto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(user.tenantId, id, statusDto.status);
  }
}
