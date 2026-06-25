import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql, lte, ne } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { ILabOrdersRepository } from '../domain/lab-orders.repository.interface';
import { LabOrder } from '../domain/lab-order.entity';
import { LabOrderStatusHistory } from '../domain/lab-order-status-history.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class LabOrdersRepositoryImpl implements ILabOrdersRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async createOrder(
    tenantId: string,
    orderData: Omit<LabOrder, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ): Promise<LabOrder> {
    const [row] = await this.db
      .insert(schema.labOrders)
      .values({
        tenantId,
        patientId: orderData.patientId,
        treatmentId: orderData.treatmentId,
        toothNumber: orderData.toothNumber,
        labName: orderData.labName,
        labContact: orderData.labContact,
        workType: orderData.workType,
        shade: orderData.shade,
        material: orderData.material,
        expectedReturnDate: orderData.expectedReturnDate ? orderData.expectedReturnDate.toISOString().split('T')[0] : null,
        cost: orderData.cost ? String(orderData.cost) : null,
        patientCharge: orderData.patientCharge ? String(orderData.patientCharge) : null,
        notes: orderData.notes,
        status: 'ordered',
      })
      .returning();
    return this.mapToOrderEntity(row);
  }

  async findOrderById(tenantId: string, id: string): Promise<LabOrder | null> {
    const [row] = await this.db
      .select({
        order: schema.labOrders,
        patientName: sql`concat(${schema.patients.firstName}, ' ', ${schema.patients.lastName})`,
        patientPhone: schema.patients.phone,
      })
      .from(schema.labOrders)
      .leftJoin(schema.patients, eq(schema.labOrders.patientId, schema.patients.id))
      .where(and(eq(schema.labOrders.tenantId, tenantId), eq(schema.labOrders.id, id)))
      .limit(1);
      
    return row ? this.mapToOrderEntity(row.order, {
      patientName: row.patientName as string,
      patientPhone: row.patientPhone as string,
    }) : null;
  }

  async findOrders(
    tenantId: string,
    filters?: { status?: string; overdue?: boolean; patientId?: string },
  ): Promise<LabOrder[]> {
    let whereClause = eq(schema.labOrders.tenantId, tenantId);
    
    if (filters?.status) {
      whereClause = and(whereClause, eq(schema.labOrders.status, filters.status)) as any;
    }
    
    if (filters?.patientId) {
      whereClause = and(whereClause, eq(schema.labOrders.patientId, filters.patientId)) as any;
    }
    
    if (filters?.overdue) {
      const todayStr = new Date().toISOString().split('T')[0];
      whereClause = and(
        whereClause,
        lte(schema.labOrders.expectedReturnDate, todayStr),
        ne(schema.labOrders.status, 'received'),
        ne(schema.labOrders.status, 'fitted'),
      ) as any;
    }
    
    const rows = await this.db
      .select({
        order: schema.labOrders,
        patientName: sql`concat(${schema.patients.firstName}, ' ', ${schema.patients.lastName})`,
        patientPhone: schema.patients.phone,
      })
      .from(schema.labOrders)
      .leftJoin(schema.patients, eq(schema.labOrders.patientId, schema.patients.id))
      .where(whereClause)
      .orderBy(sql`${schema.labOrders.expectedReturnDate} ASC, ${schema.labOrders.createdAt} DESC`);
      
    return rows.map(r => this.mapToOrderEntity(r.order, {
      patientName: r.patientName as string,
      patientPhone: r.patientPhone as string,
    }));
  }

  async updateOrder(
    tenantId: string,
    id: string,
    data: Partial<Omit<LabOrder, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<LabOrder> {
    const updateData: any = { ...data };
    if (data.expectedReturnDate !== undefined) {
      updateData.expectedReturnDate = data.expectedReturnDate ? data.expectedReturnDate.toISOString().split('T')[0] : null;
    }
    if (data.actualReturnDate !== undefined) {
      updateData.actualReturnDate = data.actualReturnDate ? data.actualReturnDate.toISOString().split('T')[0] : null;
    }
    if (data.cost !== undefined) updateData.cost = data.cost !== null ? String(data.cost) : null;
    if (data.patientCharge !== undefined) updateData.patientCharge = data.patientCharge !== null ? String(data.patientCharge) : null;
    
    const [row] = await this.db
      .update(schema.labOrders)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.labOrders.tenantId, tenantId), eq(schema.labOrders.id, id)))
      .returning();
      
    if (!row) {
      throw new NotFoundException(`Lab order with ID ${id} not found`);
    }
    return this.mapToOrderEntity(row);
  }

  async deleteOrder(tenantId: string, id: string): Promise<void> {
    await this.db
      .delete(schema.labOrders)
      .where(and(eq(schema.labOrders.tenantId, tenantId), eq(schema.labOrders.id, id)));
  }

  async createStatusHistory(
    tenantId: string,
    historyData: Omit<LabOrderStatusHistory, 'id' | 'changedAt'>,
  ): Promise<LabOrderStatusHistory> {
    const [row] = await this.db
      .insert(schema.labOrderStatusHistory)
      .values({
        tenantId,
        labOrderId: historyData.labOrderId,
        status: historyData.status,
        changedBy: historyData.changedBy,
        notes: historyData.notes,
      })
      .returning();
    return this.mapToHistoryEntity(row);
  }

  async findStatusHistory(tenantId: string, labOrderId: string): Promise<LabOrderStatusHistory[]> {
    const rows = await this.db
      .select({
        history: schema.labOrderStatusHistory,
        changerName: sql`concat(${schema.users.firstName}, ' ', ${schema.users.lastName})`,
      })
      .from(schema.labOrderStatusHistory)
      .leftJoin(schema.users, eq(schema.labOrderStatusHistory.changedBy, schema.users.id))
      .where(
        and(
          eq(schema.labOrderStatusHistory.tenantId, tenantId),
          eq(schema.labOrderStatusHistory.labOrderId, labOrderId),
        ),
      )
      .orderBy(sql`${schema.labOrderStatusHistory.changedAt} DESC`);
      
    return rows.map(r => this.mapToHistoryEntity(r.history, r.changerName as string));
  }

  private mapToOrderEntity(row: any, extra?: { patientName?: string; patientPhone?: string }): LabOrder {
    return new LabOrder(
      row.id,
      row.tenantId,
      row.patientId,
      row.treatmentId,
      row.toothNumber,
      row.labName,
      row.labContact,
      row.workType,
      row.shade,
      row.material,
      row.orderDate ? new Date(row.orderDate) : new Date(),
      row.expectedReturnDate ? new Date(row.expectedReturnDate) : null,
      row.actualReturnDate ? new Date(row.actualReturnDate) : null,
      row.status,
      row.cost ? Number(row.cost) : null,
      row.patientCharge ? Number(row.patientCharge) : null,
      row.notes,
      row.createdAt,
      row.updatedAt,
      extra?.patientName,
      extra?.patientPhone,
    );
  }

  private mapToHistoryEntity(row: any, changerName?: string): LabOrderStatusHistory {
    return new LabOrderStatusHistory(
      row.id,
      row.tenantId,
      row.labOrderId,
      row.status,
      row.changedBy,
      row.changedAt,
      row.notes,
      changerName,
    );
  }
}
