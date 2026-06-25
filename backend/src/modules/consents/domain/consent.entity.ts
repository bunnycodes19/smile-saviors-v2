export class Consent {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly treatmentId: string | null,
    public readonly templateId: string,
    public readonly signedImageUrl: string,
    public readonly signedAt: Date,
    public readonly signerName: string,
    public readonly isGuardian: boolean,
    public readonly guardianRelation: string | null,
    public readonly witnessName: string | null,
    public readonly pdfUrl: string | null,
    public readonly ipAddress: string | null,
    public readonly createdAt: Date,
  ) {}
}
