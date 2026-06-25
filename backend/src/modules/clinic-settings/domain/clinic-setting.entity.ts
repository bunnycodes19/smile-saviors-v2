export class ClinicSetting {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly toothNumbering: string, // fdi | universal | palmer
    public readonly currency: string,
    public readonly dateFormat: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
