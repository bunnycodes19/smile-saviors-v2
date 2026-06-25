export class PatientDocument {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly documentType: string, // medical_history | referral | lab_report | insurance | consent | prescription | radiograph | other
    public readonly fileUrl: string,
    public readonly thumbnailUrl: string | null,
    public readonly fileName: string | null,
    public readonly fileSize: number | null,
    public readonly mimeType: string | null,
    public readonly uploadedBy: string,
    public readonly description: string | null,
    public readonly tags: string[],
    public readonly sourceId: string | null,
    public readonly sourceType: string | null,
    public readonly createdAt: Date,
  ) {}
}
