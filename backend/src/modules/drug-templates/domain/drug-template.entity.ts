export class DrugTemplate {
  constructor(
    public readonly id: string,
    public readonly tenantId: string | null,
    public readonly name: string,
    public readonly genericName: string | null,
    public readonly category: string | null,
    public readonly defaultDosage: string | null,
    public readonly defaultFrequency: string | null,
    public readonly defaultDuration: number | null,
    public readonly defaultInstructions: string | null,
    public readonly contraindications: string[],
    public readonly createdAt: Date,
  ) {}
}
