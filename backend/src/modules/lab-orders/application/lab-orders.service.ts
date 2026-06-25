import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { ILabOrdersRepository } from '../domain/lab-orders.repository.interface';
import { LabOrder } from '../domain/lab-order.entity';
import { LabOrderStatusHistory } from '../domain/lab-order-status-history.entity';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';
import { UpdateLabOrderStatusDto } from './dto/update-lab-order-status.dto';
import { INotificationService } from '../../notifications/domain/notification.service.interface';

@Injectable()
export class LabOrdersService {
  private readonly logger = new Logger(LabOrdersService.name);

  constructor(
    @Inject('ILabOrdersRepository')
    private readonly labOrdersRepository: ILabOrdersRepository,
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async createOrder(tenantId: string, dto: CreateLabOrderDto, userId: string): Promise<LabOrder> {
    const order = await this.labOrdersRepository.createOrder(tenantId, {
      tenantId,
      patientId: dto.patientId,
      treatmentId: dto.treatmentId ?? null,
      toothNumber: dto.toothNumber ?? null,
      labName: dto.labName,
      labContact: dto.labContact ?? null,
      workType: dto.workType,
      shade: dto.shade ?? null,
      material: dto.material ?? null,
      orderDate: new Date(),
      expectedReturnDate: dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null,
      actualReturnDate: null,
      cost: dto.cost ?? null,
      patientCharge: dto.patientCharge ?? null,
      notes: dto.notes ?? null,
    });

    // Create initial status history
    await this.labOrdersRepository.createStatusHistory(tenantId, {
      tenantId,
      labOrderId: order.id,
      status: 'ordered',
      changedBy: userId,
      notes: 'Lab order created',
    });

    return order;
  }

  async findOrders(
    tenantId: string,
    filters?: { status?: string; overdue?: boolean; patientId?: string },
  ): Promise<LabOrder[]> {
    return this.labOrdersRepository.findOrders(tenantId, filters);
  }

  async findOrderById(tenantId: string, id: string): Promise<LabOrder> {
    const order = await this.labOrdersRepository.findOrderById(tenantId, id);
    if (!order) {
      throw new NotFoundException(`Lab order with ID ${id} not found`);
    }
    return order;
  }

  async updateOrder(tenantId: string, id: string, dto: UpdateLabOrderDto): Promise<LabOrder> {
    await this.findOrderById(tenantId, id);
    const updateData: any = { ...dto };
    if (dto.expectedReturnDate) updateData.expectedReturnDate = new Date(dto.expectedReturnDate);
    if (dto.actualReturnDate) updateData.actualReturnDate = new Date(dto.actualReturnDate);

    return this.labOrdersRepository.updateOrder(tenantId, id, updateData);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateLabOrderStatusDto,
  ): Promise<LabOrder> {
    const order = await this.findOrderById(tenantId, id);
    
    const updateData: any = { status: dto.status };
    if (dto.status === 'received') {
      updateData.actualReturnDate = new Date();
    }

    const updatedOrder = await this.labOrdersRepository.updateOrder(tenantId, id, updateData);
    
    // Log history
    await this.labOrdersRepository.createStatusHistory(tenantId, {
      tenantId,
      labOrderId: id,
      status: dto.status,
      changedBy: userId,
      notes: dto.notes ?? null,
    });

    // Check if status is received -> notify patient!
    if (dto.status === 'received') {
      try {
        if (order.patientPhone && order.patientName) {
          // Send patient notification
          const msg = `Dear ${order.patientName}, your lab work (${order.workType}) has arrived at the clinic. Please call us to book your fitting appointment.`;
          await this.notificationService.sendWhatsApp(order.patientPhone, msg);
          this.logger.log(`Sent lab work arrival notification to patient ${order.patientId}`);
        }
      } catch (err: any) {
        this.logger.error(`Failed to send lab work notification: ${err.message}`);
      }
    }

    return updatedOrder;
  }

  async findStatusHistory(tenantId: string, labOrderId: string): Promise<LabOrderStatusHistory[]> {
    await this.findOrderById(tenantId, labOrderId);
    return this.labOrdersRepository.findStatusHistory(tenantId, labOrderId);
  }

  async deleteOrder(tenantId: string, id: string): Promise<void> {
    await this.findOrderById(tenantId, id);
    await this.labOrdersRepository.deleteOrder(tenantId, id);
  }
}
