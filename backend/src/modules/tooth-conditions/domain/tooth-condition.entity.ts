export class ToothCondition {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly toothNumber: string,
    public readonly surface: string | null,
    public readonly conditionCode: string,
    public readonly status: string,
    public readonly dateRecorded: Date,
    public readonly visitId: string | null,
    public readonly dentistId: string | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
