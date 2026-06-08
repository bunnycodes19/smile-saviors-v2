import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IBillingRepository } from '../domain/billing.repository.interface';
import { Invoice, InvoiceItem } from '../domain/invoice.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class BillingRepositoryImpl implements IBillingRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async createInvoice(
    tenantId: string,
    patientId: string,
    dueDate: Date,
    items: Omit<InvoiceItem, 'id' | 'invoiceId' | 'totalPrice' | 'createdAt'>[],
    appointmentId?: string | null,
  ): Promise<Invoice> {
    return this.db.transaction(async (tx) => {
      // Calculate total amount
      let totalAmount = 0;
      const formattedItems = items.map((item) => {
        const itemTotal = Number(item.unitPrice) * item.quantity;
        totalAmount += itemTotal;
        return {
          treatmentId: item.treatmentId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: itemTotal.toFixed(2),
        };
      });

      // Insert invoice
      const [invoiceRow] = await tx
        .insert(schema.invoices)
        .values({
          tenantId,
          patientId,
          appointmentId: appointmentId || null,
          totalAmount: totalAmount.toFixed(2),
          paidAmount: '0.00',
          status: 'UNPAID',
          dueDate: dueDate.toISOString().split('T')[0] as any,
        })
        .returning();

      // Insert items
      if (formattedItems.length > 0) {
        await tx.insert(schema.invoiceItems).values(
          formattedItems.map((item) => ({
            invoiceId: invoiceRow.id,
            treatmentId: item.treatmentId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        );
      }

      return new Invoice(
        invoiceRow.id,
        invoiceRow.tenantId,
        invoiceRow.patientId,
        invoiceRow.appointmentId,
        invoiceRow.totalAmount.toString(),
        invoiceRow.paidAmount.toString(),
        invoiceRow.status as any,
        invoiceRow.dueDate,
        invoiceRow.createdAt,
        invoiceRow.updatedAt,
      );
    });
  }

  async findAllInvoices(tenantId: string): Promise<any[]> {
    const rows = await this.db
      .select({
        id: schema.invoices.id,
        tenantId: schema.invoices.tenantId,
        patientId: schema.invoices.patientId,
        appointmentId: schema.invoices.appointmentId,
        totalAmount: schema.invoices.totalAmount,
        paidAmount: schema.invoices.paidAmount,
        status: schema.invoices.status,
        dueDate: schema.invoices.dueDate,
        createdAt: schema.invoices.createdAt,
        updatedAt: schema.invoices.updatedAt,
        patientFirstName: schema.patients.firstName,
        patientLastName: schema.patients.lastName,
      })
      .from(schema.invoices)
      .leftJoin(schema.patients, eq(schema.invoices.patientId, schema.patients.id))
      .where(eq(schema.invoices.tenantId, tenantId))
      .orderBy(schema.invoices.createdAt);

    return rows;
  }

  async findInvoiceById(
    tenantId: string,
    id: string,
  ): Promise<{ invoice: Invoice; items: InvoiceItem[] } | null> {
    const invoices = await this.db
      .select()
      .from(schema.invoices)
      .where(and(eq(schema.invoices.tenantId, tenantId), eq(schema.invoices.id, id)))
      .limit(1);

    if (invoices.length === 0) return null;
    const invoiceRow = invoices[0];

    const itemRows = await this.db
      .select()
      .from(schema.invoiceItems)
      .where(eq(schema.invoiceItems.invoiceId, id));

    const invoice = new Invoice(
      invoiceRow.id,
      invoiceRow.tenantId,
      invoiceRow.patientId,
      invoiceRow.appointmentId,
      invoiceRow.totalAmount.toString(),
      invoiceRow.paidAmount.toString(),
      invoiceRow.status as any,
      invoiceRow.dueDate,
      invoiceRow.createdAt,
      invoiceRow.updatedAt,
    );

    const items = itemRows.map(
      (row) =>
        new InvoiceItem(
          row.id,
          row.invoiceId,
          row.treatmentId,
          row.description,
          row.quantity,
          row.unitPrice.toString(),
          row.totalPrice.toString(),
          row.createdAt,
        ),
    );

    return { invoice, items };
  }

  async recordPayment(tenantId: string, id: string, amount: string): Promise<Invoice> {
    const invoices = await this.db
      .select()
      .from(schema.invoices)
      .where(and(eq(schema.invoices.tenantId, tenantId), eq(schema.invoices.id, id)))
      .limit(1);

    if (invoices.length === 0) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    const invoice = invoices[0];
    const totalAmount = Number(invoice.totalAmount);
    const newPaidAmount = Number(invoice.paidAmount) + Number(amount);

    let status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'PARTIALLY_PAID';
    if (newPaidAmount >= totalAmount) {
      status = 'PAID';
    } else if (newPaidAmount <= 0) {
      status = 'UNPAID';
    }

    const [updatedRow] = await this.db
      .update(schema.invoices)
      .set({
        paidAmount: Math.min(newPaidAmount, totalAmount).toFixed(2),
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.invoices.tenantId, tenantId), eq(schema.invoices.id, id)))
      .returning();

    return new Invoice(
      updatedRow.id,
      updatedRow.tenantId,
      updatedRow.patientId,
      updatedRow.appointmentId,
      updatedRow.totalAmount.toString(),
      updatedRow.paidAmount.toString(),
      updatedRow.status as any,
      updatedRow.dueDate,
      updatedRow.createdAt,
      updatedRow.updatedAt,
    );
  }
}
