export class Invoice {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly appointmentId: string | null,
    public readonly totalAmount: string,
    public readonly paidAmount: string,
    public readonly status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'VOID',
    public readonly dueDate: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class InvoiceItem {
  constructor(
    public readonly id: string,
    public readonly invoiceId: string,
    public readonly treatmentId: string | null,
    public readonly description: string,
    public readonly quantity: number,
    public readonly unitPrice: string,
    public readonly totalPrice: string,
    public readonly createdAt: Date,
  ) {}
}
