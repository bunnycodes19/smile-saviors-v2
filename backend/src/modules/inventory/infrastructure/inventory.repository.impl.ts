import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IInventoryRepository } from '../domain/inventory.repository.interface';
import { InventoryItem } from '../domain/inventory-item.entity';
import { InventoryTransaction } from '../domain/inventory-transaction.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class InventoryRepositoryImpl implements IInventoryRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async createItem(
    tenantId: string,
    itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<InventoryItem> {
    const [row] = await this.db
      .insert(schema.inventoryItems)
      .values({
        tenantId,
        name: itemData.name,
        category: itemData.category,
        unit: itemData.unit,
        currentStock: String(itemData.currentStock ?? 0),
        reorderThreshold: String(itemData.reorderThreshold ?? 0),
        unitCost: itemData.unitCost ? String(itemData.unitCost) : null,
        supplierName: itemData.supplierName,
        supplierContact: itemData.supplierContact,
      })
      .returning();
    return this.mapToItemEntity(row);
  }

  async findItemById(tenantId: string, id: string): Promise<InventoryItem | null> {
    const [row] = await this.db
      .select()
      .from(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.tenantId, tenantId), eq(schema.inventoryItems.id, id)))
      .limit(1);
    return row ? this.mapToItemEntity(row) : null;
  }

  async findItems(tenantId: string, filters?: { category?: string; lowStock?: boolean }): Promise<InventoryItem[]> {
    let whereClause = eq(schema.inventoryItems.tenantId, tenantId);
    if (filters?.category) {
      whereClause = and(whereClause, eq(schema.inventoryItems.category, filters.category)) as any;
    }
    if (filters?.lowStock) {
      whereClause = and(whereClause, sql`${schema.inventoryItems.currentStock} <= ${schema.inventoryItems.reorderThreshold}`) as any;
    }
    
    const rows = await this.db
      .select()
      .from(schema.inventoryItems)
      .where(whereClause)
      .orderBy(schema.inventoryItems.name);
      
    return rows.map(r => this.mapToItemEntity(r));
  }

  async updateItem(
    tenantId: string,
    id: string,
    data: Partial<Omit<InventoryItem, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<InventoryItem> {
    const updateData: any = { ...data };
    if (data.currentStock !== undefined) updateData.currentStock = String(data.currentStock);
    if (data.reorderThreshold !== undefined) updateData.reorderThreshold = String(data.reorderThreshold);
    if (data.unitCost !== undefined) updateData.unitCost = data.unitCost !== null ? String(data.unitCost) : null;
    
    const [row] = await this.db
      .update(schema.inventoryItems)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.inventoryItems.tenantId, tenantId), eq(schema.inventoryItems.id, id)))
      .returning();
      
    if (!row) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return this.mapToItemEntity(row);
  }

  async updateItemStock(tenantId: string, id: string, newStock: number): Promise<void> {
    await this.db
      .update(schema.inventoryItems)
      .set({
        currentStock: String(newStock),
        updatedAt: new Date(),
      })
      .where(and(eq(schema.inventoryItems.tenantId, tenantId), eq(schema.inventoryItems.id, id)));
  }

  async deleteItem(tenantId: string, id: string): Promise<void> {
    await this.db
      .delete(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.tenantId, tenantId), eq(schema.inventoryItems.id, id)));
  }

  async createTransaction(
    tenantId: string,
    txData: Omit<InventoryTransaction, 'id' | 'createdAt'>,
  ): Promise<InventoryTransaction> {
    const [row] = await this.db
      .insert(schema.inventoryTransactions)
      .values({
        tenantId,
        itemId: txData.itemId,
        type: txData.type,
        quantity: String(txData.quantity),
        date: txData.date.toISOString().split('T')[0],
        relatedTreatmentId: txData.relatedTreatmentId,
        recordedBy: txData.recordedBy,
        notes: txData.notes,
      })
      .returning();
    return this.mapToTransactionEntity(row);
  }

  async findTransactionsByItem(tenantId: string, itemId: string): Promise<InventoryTransaction[]> {
    const rows = await this.db
      .select({
        tx: schema.inventoryTransactions,
        itemName: schema.inventoryItems.name,
        recorderName: sql`concat(${schema.users.firstName}, ' ', ${schema.users.lastName})`,
      })
      .from(schema.inventoryTransactions)
      .leftJoin(schema.inventoryItems, eq(schema.inventoryTransactions.itemId, schema.inventoryItems.id))
      .leftJoin(schema.users, eq(schema.inventoryTransactions.recordedBy, schema.users.id))
      .where(and(eq(schema.inventoryTransactions.tenantId, tenantId), eq(schema.inventoryTransactions.itemId, itemId)))
      .orderBy(sql`${schema.inventoryTransactions.createdAt} DESC`);
      
    return rows.map(r => this.mapToTransactionEntity(r.tx, {
      itemName: r.itemName as string,
      recorderName: r.recorderName as string,
    }));
  }

  async findRecentTransactions(tenantId: string, limit = 50): Promise<InventoryTransaction[]> {
    const rows = await this.db
      .select({
        tx: schema.inventoryTransactions,
        itemName: schema.inventoryItems.name,
        recorderName: sql`concat(${schema.users.firstName}, ' ', ${schema.users.lastName})`,
      })
      .from(schema.inventoryTransactions)
      .leftJoin(schema.inventoryItems, eq(schema.inventoryTransactions.itemId, schema.inventoryItems.id))
      .leftJoin(schema.users, eq(schema.inventoryTransactions.recordedBy, schema.users.id))
      .where(eq(schema.inventoryTransactions.tenantId, tenantId))
      .orderBy(sql`${schema.inventoryTransactions.createdAt} DESC`)
      .limit(limit);
      
    return rows.map(r => this.mapToTransactionEntity(r.tx, {
      itemName: r.itemName as string,
      recorderName: r.recorderName as string,
    }));
  }

  private mapToItemEntity(row: any): InventoryItem {
    return new InventoryItem(
      row.id,
      row.tenantId,
      row.name,
      row.category,
      row.unit,
      Number(row.currentStock),
      Number(row.reorderThreshold),
      row.unitCost ? Number(row.unitCost) : null,
      row.supplierName,
      row.supplierContact,
      row.createdAt,
      row.updatedAt,
    );
  }

  private mapToTransactionEntity(row: any, extra?: { itemName?: string; recorderName?: string }): InventoryTransaction {
    return new InventoryTransaction(
      row.id,
      row.tenantId,
      row.itemId,
      row.type,
      Number(row.quantity),
      new Date(row.date),
      row.relatedTreatmentId,
      row.recordedBy,
      row.notes,
      row.createdAt,
      extra?.itemName,
      extra?.recorderName,
    );
  }
}
