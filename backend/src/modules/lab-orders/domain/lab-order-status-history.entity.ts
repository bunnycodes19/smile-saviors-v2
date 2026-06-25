export class LabOrderStatusHistory {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly labOrderId: string,
    public readonly status: string,
    public readonly changedBy: string,
    public readonly changedAt: Date,
    public readonly notes: string | null,
    public readonly changerName?: string,
  ) {}
}
