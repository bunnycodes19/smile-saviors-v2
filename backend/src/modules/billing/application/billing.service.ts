import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBillingRepository } from '../domain/billing.repository.interface';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Invoice, InvoiceItem } from '../domain/invoice.entity';

@Injectable()
export class BillingService {
  constructor(
    @Inject('IBillingRepository')
    private readonly billingRepository: IBillingRepository,
  ) {}

  async createInvoice(tenantId: string, createDto: CreateInvoiceDto): Promise<Invoice> {
    const dueDate = new Date(createDto.dueDate);
    const items = createDto.items.map((item) => ({
      treatmentId: item.treatmentId || null,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    return this.billingRepository.createInvoice(
      tenantId,
      createDto.patientId,
      dueDate,
      items as any,
      createDto.appointmentId || null,
    );
  }

  async findAllInvoices(tenantId: string): Promise<any[]> {
    return this.billingRepository.findAllInvoices(tenantId);
  }

  async findInvoiceById(tenantId: string, id: string): Promise<{ invoice: Invoice; items: InvoiceItem[] }> {
    const result = await this.billingRepository.findInvoiceById(tenantId, id);
    if (!result) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return result;
  }

  async recordPayment(tenantId: string, id: string, amount: string): Promise<Invoice> {
    return this.billingRepository.recordPayment(tenantId, id, amount);
  }
}
