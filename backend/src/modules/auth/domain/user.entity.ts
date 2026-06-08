export class User {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: 'ADMIN' | 'DENTIST' | 'RECEPTIONIST',
    public readonly phone: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
