export class RecallSchedule {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly toothNumber: string | null,
    public readonly sourceTreatmentId: string | null,
    public readonly ruleId: string | null,
    public readonly dueDate: Date,
    public readonly status: string, // pending | booked | completed | missed
    public readonly reminderSent: boolean,
    public readonly reminderSentAt: Date | null,
    public readonly createdAt: Date,
    // Add joined information for UI display convenience
    public readonly patientName?: string,
    public readonly patientPhone?: string,
    public readonly procedureType?: string,
  ) {}
}
