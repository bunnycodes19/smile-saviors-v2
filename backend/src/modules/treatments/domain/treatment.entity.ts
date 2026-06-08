export class Treatment {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly dentistId: string,
    public readonly appointmentId: string | null,
    public readonly toothNumber: number | null,
    public readonly procedureName: string,
    public readonly notes: string | null,
    public readonly price: string,
    public readonly status: 'PLANNED' | 'COMPLETED',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
