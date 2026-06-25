export interface PrescriptionItem {
  id?: string;
  prescriptionId?: string;
  drugName: string;
  dosage: string | null;
  frequency: string | null;
  durationDays: number | null;
  instructions: string | null;
}

export class Prescription {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly visitId: string | null,
    public readonly dentistId: string,
    public readonly date: Date,
    public readonly pdfUrl: string | null,
    public readonly createdAt: Date,
    public readonly items: PrescriptionItem[] = [],
  ) {}
}
