import { Invoice, InvoiceItem } from './invoice.entity';

export interface IBillingRepository {
  createInvoice(
    tenantId: string,
    patientId: string,
    dueDate: Date,
    items: Omit<InvoiceItem, 'id' | 'invoiceId' | 'totalPrice' | 'createdAt'>[],
    appointmentId?: string | null,
  ): Promise<Invoice>;

  findAllInvoices(tenantId: string): Promise<any[]>;
  findInvoiceById(tenantId: string, id: string): Promise<{ invoice: Invoice; items: InvoiceItem[] } | null>;
  recordPayment(tenantId: string, id: string, amount: string): Promise<Invoice>;
}
