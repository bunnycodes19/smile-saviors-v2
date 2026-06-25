import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LabOrdersService } from '../application/lab-orders.service';
import { CreateLabOrderDto } from '../application/dto/create-lab-order.dto';
import { UpdateLabOrderDto } from '../application/dto/update-lab-order.dto';
import { UpdateLabOrderStatusDto } from '../application/dto/update-lab-order-status.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('lab-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabOrdersController {
  constructor(private readonly labOrdersService: LabOrdersService) {}

  @Get()
  async getOrders(
    @CurrentUser() user: UserContext,
    @Query('status') status?: string,
    @Query('overdue') overdue?: string,
    @Query('patientId') patientId?: string,
  ) {
    const filters = {
      status,
      patientId,
      overdue: overdue === 'true',
    };
    return this.labOrdersService.findOrders(user.tenantId, filters);
  }

  @Get(':id')
  async getOrderById(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.labOrdersService.findOrderById(user.tenantId, id);
  }

  @Post()
  @Roles('ADMIN', 'DENTIST')
  async createOrder(@CurrentUser() user: UserContext, @Body() dto: CreateLabOrderDto) {
    return this.labOrdersService.createOrder(user.tenantId, dto, user.userId);
  }

  @Put(':id')
  @Roles('ADMIN', 'DENTIST')
  async updateOrder(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateLabOrderDto,
  ) {
    return this.labOrdersService.updateOrder(user.tenantId, id, dto);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'DENTIST', 'RECEPTIONIST')
  async updateStatus(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateLabOrderStatusDto,
  ) {
    return this.labOrdersService.updateStatus(user.tenantId, id, user.userId, dto);
  }

  @Get(':id/history')
  async getStatusHistory(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.labOrdersService.findStatusHistory(user.tenantId, id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async deleteOrder(@CurrentUser() user: UserContext, @Param('id') id: string) {
    await this.labOrdersService.deleteOrder(user.tenantId, id);
    return { success: true };
  }
}
