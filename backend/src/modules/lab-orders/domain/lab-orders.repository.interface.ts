import { LabOrder } from './lab-order.entity';
import { LabOrderStatusHistory } from './lab-order-status-history.entity';

export interface ILabOrdersRepository {
  createOrder(tenantId: string, order: Omit<LabOrder, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<LabOrder>;
  findOrderById(tenantId: string, id: string): Promise<LabOrder | null>;
  findOrders(tenantId: string, filters?: { status?: string; overdue?: boolean; patientId?: string }): Promise<LabOrder[]>;
  updateOrder(tenantId: string, id: string, data: Partial<Omit<LabOrder, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<LabOrder>;
  deleteOrder(tenantId: string, id: string): Promise<void>;
  
  createStatusHistory(tenantId: string, history: Omit<LabOrderStatusHistory, 'id' | 'changedAt'>): Promise<LabOrderStatusHistory>;
  findStatusHistory(tenantId: string, labOrderId: string): Promise<LabOrderStatusHistory[]>;
}
