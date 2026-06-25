import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from '../application/inventory.service';
import { CreateInventoryItemDto } from '../application/dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../application/dto/update-inventory-item.dto';
import { RecordTransactionDto } from '../application/dto/record-transaction.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  async getItems(
    @CurrentUser() user: UserContext,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    const filters = {
      category,
      lowStock: lowStock === 'true',
    };
    return this.inventoryService.findItems(user.tenantId, filters);
  }

  @Get('items/:id')
  async getItemById(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.inventoryService.findItemById(user.tenantId, id);
  }

  @Post('items')
  @Roles('ADMIN')
  async createItem(@CurrentUser() user: UserContext, @Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(user.tenantId, dto);
  }

  @Put('items/:id')
  @Roles('ADMIN')
  async updateItem(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(user.tenantId, id, dto);
  }

  @Delete('items/:id')
  @Roles('ADMIN')
  async deleteItem(@CurrentUser() user: UserContext, @Param('id') id: string) {
    await this.inventoryService.deleteItem(user.tenantId, id);
    return { success: true };
  }

  @Post('items/:id/transactions')
  @Roles('ADMIN', 'DENTIST', 'RECEPTIONIST')
  async recordTransaction(
    @CurrentUser() user: UserContext,
    @Param('id') itemId: string,
    @Body() dto: RecordTransactionDto,
  ) {
    return this.inventoryService.recordTransaction(user.tenantId, itemId, user.userId, dto);
  }

  @Get('items/:id/transactions')
  async getTransactionsByItem(@CurrentUser() user: UserContext, @Param('id') itemId: string) {
    return this.inventoryService.findTransactionsByItem(user.tenantId, itemId);
  }

  @Get('transactions/recent')
  async getRecentTransactions(@CurrentUser() user: UserContext, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.inventoryService.findRecentTransactions(user.tenantId, limitNum);
  }
}
