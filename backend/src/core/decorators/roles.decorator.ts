import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('ADMIN' | 'DENTIST' | 'RECEPTIONIST')[]) => SetMetadata(ROLES_KEY, roles);
