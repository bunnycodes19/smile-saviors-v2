export class Procedure {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly toothNumber: string | null,
    public readonly procedureType: string, // RCT, Ortho, Implant, etc.
    public readonly status: string, // in_progress | completed | abandoned
    public readonly startDate: Date,
    public readonly expectedSittings: number | null,
    public readonly totalCost: string | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
