export class RecallRule {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly procedureType: string,
    public readonly intervalDays: number,
    public readonly recurring: boolean,
    public readonly reminderText: string | null,
    public readonly createdAt: Date,
  ) {}
}
