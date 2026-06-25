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
    public readonly status: string, // 'PROPOSED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // Clinical expansion columns
    public readonly chiefComplaint: string | null = null,
    public readonly symptoms: string | null = null,
    public readonly diagnosis: string | null = null,
    public readonly followUpInstructions: string | null = null,
    public readonly clinicalNotes: string | null = null,
    public readonly estimatedCost: string | null = null,
    public readonly acceptedAt: Date | null = null,
    public readonly completedAt: Date | null = null,
    public readonly treatmentGroupId: string | null = null,
  ) {}
}
