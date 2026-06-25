export class LabOrder {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly treatmentId: string | null,
    public readonly toothNumber: string | null,
    public readonly labName: string,
    public readonly labContact: string | null,
    public readonly workType: string, // crown | bridge | denture | aligner | nightguard | retainer | veneer | inlay_onlay
    public readonly shade: string | null,
    public readonly material: string | null,
    public readonly orderDate: Date,
    public readonly expectedReturnDate: Date | null,
    public readonly actualReturnDate: Date | null,
    public readonly status: string, // ordered | sent_to_lab | in_progress | received | fitted | rework_needed
    public readonly cost: number | null,
    public readonly patientCharge: number | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // Joined convenience info
    public readonly patientName?: string,
    public readonly patientPhone?: string,
  ) {}
}
