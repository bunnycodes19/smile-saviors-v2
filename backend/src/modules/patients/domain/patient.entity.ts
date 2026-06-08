export class Patient {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly dob: string,
    public readonly gender: string,
    public readonly phone: string,
    public readonly email: string | null,
    public readonly address: string | null,
    public readonly medicalHistory: string[],
    public readonly allergies: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
