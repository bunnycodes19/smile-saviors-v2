import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './application/auth.service';
import { AuthController } from './presentation/auth.controller';
import { AuthRepositoryImpl } from './infrastructure/auth.repository.impl';
import { JwtStrategy } from '../../core/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-smile-saviors-key-2026',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'IAuthRepository',
      useClass: AuthRepositoryImpl,
    },
  ],
  exports: [AuthService, 'IAuthRepository'],
})
export class AuthModule {}
