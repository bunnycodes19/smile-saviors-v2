import { InventoryItem } from './inventory-item.entity';
import { InventoryTransaction } from './inventory-transaction.entity';

export interface IInventoryRepository {
  createItem(tenantId: string, item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem>;
  findItemById(tenantId: string, id: string): Promise<InventoryItem | null>;
  findItems(tenantId: string, filters?: { category?: string; lowStock?: boolean }): Promise<InventoryItem[]>;
  updateItem(tenantId: string, id: string, data: Partial<Omit<InventoryItem, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<InventoryItem>;
  updateItemStock(tenantId: string, id: string, newStock: number): Promise<void>;
  deleteItem(tenantId: string, id: string): Promise<void>;
  
  createTransaction(tenantId: string, tx: Omit<InventoryTransaction, 'id' | 'createdAt'>): Promise<InventoryTransaction>;
  findTransactionsByItem(tenantId: string, itemId: string): Promise<InventoryTransaction[]>;
  findRecentTransactions(tenantId: string, limit?: number): Promise<InventoryTransaction[]>;
}
