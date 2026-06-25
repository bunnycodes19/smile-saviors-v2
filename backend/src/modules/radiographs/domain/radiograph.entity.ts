export class Radiograph {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly imageType: string,
    public readonly imageUrl: string,
    public readonly thumbnailUrl: string | null,
    public readonly toothNumbers: string | null,
    public readonly takenDate: Date | null,
    public readonly visitId: string | null,
    public readonly uploadedBy: string,
    public readonly notes: string | null,
    public readonly createdAt: Date,
  ) {}
}
