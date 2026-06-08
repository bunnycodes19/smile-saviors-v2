import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserContext } from '../interfaces/request-with-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-smile-saviors-key-2026',
    });
  }

  async validate(payload: any): Promise<UserContext> {
    if (!payload.sub || !payload.tenantId || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email,
    };
  }
}
