export class ConsentTemplate {
  constructor(
    public readonly id: string,
    public readonly tenantId: string | null,
    public readonly procedureType: string,
    public readonly title: string,
    public readonly legalText: string,
    public readonly requiresGuardian: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
