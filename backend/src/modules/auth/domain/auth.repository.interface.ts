import { User } from './user.entity';
import { Tenant } from './tenant.entity';

export interface IAuthRepository {
  createTenant(name: string, subdomain: string): Promise<Tenant>;
  createUser(
    tenantId: string,
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
    role: 'ADMIN' | 'DENTIST' | 'RECEPTIONIST',
    phone?: string,
  ): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findTenantById(id: string): Promise<Tenant | null>;
  findTenantBySubdomain(subdomain: string): Promise<Tenant | null>;
}
