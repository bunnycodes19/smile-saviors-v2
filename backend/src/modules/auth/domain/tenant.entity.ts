export class Tenant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly subdomain: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
