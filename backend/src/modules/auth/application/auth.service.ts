import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IAuthRepository } from '../domain/auth.repository.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../domain/user.entity';
import { Tenant } from '../domain/tenant.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: Omit<User, 'passwordHash'>; tenant: Tenant }> {
    const existingTenant = await this.authRepository.findTenantBySubdomain(registerDto.subdomain);
    if (existingTenant) {
      throw new ConflictException('Subdomain is already registered');
    }

    const existingUser = await this.authRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // Create Tenant first
    const tenant = await this.authRepository.createTenant(registerDto.clinicName, registerDto.subdomain);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    // Create Admin User
    const user = await this.authRepository.createUser(
      tenant.id,
      registerDto.email,
      passwordHash,
      registerDto.firstName,
      registerDto.lastName,
      'ADMIN',
      registerDto.phone,
    );

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tenant };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: Omit<User, 'passwordHash'>; tenantName: string }> {
    const user = await this.authRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenant = await this.authRepository.findTenantById(user.tenantId);
    if (!tenant) {
      throw new UnauthorizedException('Clinic not found');
    }

    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      accessToken: this.jwtService.sign(payload),
      user: userWithoutPassword,
      tenantName: tenant.name,
    };
  }

  async getCurrentUser(email: string): Promise<{ user: Omit<User, 'passwordHash'>; tenantName: string }> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const tenant = await this.authRepository.findTenantById(user.tenantId);
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      tenantName: tenant ? tenant.name : '',
    };
  }
}
