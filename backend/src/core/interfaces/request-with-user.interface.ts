import { Request } from 'express';

export interface UserContext {
  userId: string;
  tenantId: string;
  role: 'ADMIN' | 'DENTIST' | 'RECEPTIONIST';
  email: string;
}

export interface RequestWithUser extends Request {
  user: UserContext;
}
