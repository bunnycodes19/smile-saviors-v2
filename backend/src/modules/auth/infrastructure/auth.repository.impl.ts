import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IAuthRepository } from '../domain/auth.repository.interface';
import { Tenant } from '../domain/tenant.entity';
import { User } from '../domain/user.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class AuthRepositoryImpl implements IAuthRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async createTenant(name: string, subdomain: string): Promise<Tenant> {
    const [row] = await this.db.insert(schema.tenants).values({ name, subdomain }).returning();
    return new Tenant(row.id, row.name, row.subdomain, row.createdAt, row.updatedAt);
  }

  async createUser(
    tenantId: string,
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
    role: 'ADMIN' | 'DENTIST' | 'RECEPTIONIST',
    phone?: string,
  ): Promise<User> {
    const [row] = await this.db
      .insert(schema.users)
      .values({
        tenantId,
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        phone,
      })
      .returning();
    return new User(
      row.id,
      row.tenantId,
      row.email,
      row.passwordHash,
      row.firstName,
      row.lastName,
      row.role as 'ADMIN' | 'DENTIST' | 'RECEPTIONIST',
      row.phone,
      row.createdAt,
      row.updatedAt,
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return new User(
      row.id,
      row.tenantId,
      row.email,
      row.passwordHash,
      row.firstName,
      row.lastName,
      row.role as 'ADMIN' | 'DENTIST' | 'RECEPTIONIST',
      row.phone,
      row.createdAt,
      row.updatedAt,
    );
  }

  async findTenantById(id: string): Promise<Tenant | null> {
    const rows = await this.db.select().from(schema.tenants).where(eq(schema.tenants.id, id)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return new Tenant(row.id, row.name, row.subdomain, row.createdAt, row.updatedAt);
  }

  async findTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    const rows = await this.db.select().from(schema.tenants).where(eq(schema.tenants.subdomain, subdomain)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return new Tenant(row.id, row.name, row.subdomain, row.createdAt, row.updatedAt);
  }
}
