import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IInventoryRepository } from '../domain/inventory.repository.interface';
import { InventoryItem } from '../domain/inventory-item.entity';
import { InventoryTransaction } from '../domain/inventory-transaction.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { RecordTransactionDto } from './dto/record-transaction.dto';

@Injectable()
export class InventoryService {
  constructor(
    @Inject('IInventoryRepository')
    private readonly inventoryRepository: IInventoryRepository,
  ) {}

  async createItem(tenantId: string, dto: CreateInventoryItemDto): Promise<InventoryItem> {
    return this.inventoryRepository.createItem(tenantId, {
      tenantId,
      name: dto.name,
      category: dto.category,
      unit: dto.unit,
      currentStock: dto.currentStock ?? 0,
      reorderThreshold: dto.reorderThreshold ?? 0,
      unitCost: dto.unitCost ?? null,
      supplierName: dto.supplierName ?? null,
      supplierContact: dto.supplierContact ?? null,
    });
  }

  async findItems(tenantId: string, filters?: { category?: string; lowStock?: boolean }): Promise<InventoryItem[]> {
    return this.inventoryRepository.findItems(tenantId, filters);
  }

  async findItemById(tenantId: string, id: string): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findItemById(tenantId, id);
    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return item;
  }

  async updateItem(tenantId: string, id: string, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    await this.findItemById(tenantId, id);
    return this.inventoryRepository.updateItem(tenantId, id, dto);
  }

  async deleteItem(tenantId: string, id: string): Promise<void> {
    await this.findItemById(tenantId, id);
    await this.inventoryRepository.deleteItem(tenantId, id);
  }

  async recordTransaction(
    tenantId: string,
    itemId: string,
    recordedBy: string,
    dto: RecordTransactionDto,
  ): Promise<InventoryTransaction> {
    const item = await this.findItemById(tenantId, itemId);
    
    let newStock = item.currentStock;
    if (dto.type === 'restock') {
      newStock += dto.quantity;
    } else if (dto.type === 'usage') {
      if (item.currentStock < dto.quantity) {
        throw new BadRequestException(`Insufficient stock for item "${item.name}". Current: ${item.currentStock} ${item.unit}, Requested: ${dto.quantity} ${item.unit}`);
      }
      newStock -= dto.quantity;
    } else if (dto.type === 'adjustment') {
      newStock += dto.quantity;
    } else {
      throw new BadRequestException(`Invalid transaction type: ${dto.type}`);
    }

    const tx = await this.inventoryRepository.createTransaction(tenantId, {
      tenantId,
      itemId,
      type: dto.type,
      quantity: dto.quantity,
      date: new Date(),
      relatedTreatmentId: dto.relatedTreatmentId ?? null,
      recordedBy,
      notes: dto.notes ?? null,
    });

    await this.inventoryRepository.updateItemStock(tenantId, itemId, newStock);
    return tx;
  }

  async findTransactionsByItem(tenantId: string, itemId: string): Promise<InventoryTransaction[]> {
    await this.findItemById(tenantId, itemId);
    return this.inventoryRepository.findTransactionsByItem(tenantId, itemId);
  }

  async findRecentTransactions(tenantId: string, limit?: number): Promise<InventoryTransaction[]> {
    return this.inventoryRepository.findRecentTransactions(tenantId, limit);
  }
}
