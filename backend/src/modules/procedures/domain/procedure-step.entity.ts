export class ProcedureStep {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly procedureId: string,
    public readonly visitId: string | null,
    public readonly stepNumber: number,
    public readonly stepDescription: string,
    public readonly date: Date | null,
    public readonly dentistId: string | null,
    public readonly dentistNotes: string | null,
    public readonly costForStep: string | null,
    public readonly status: string, // pending | completed
    public readonly createdAt: Date,
  ) {}
}
