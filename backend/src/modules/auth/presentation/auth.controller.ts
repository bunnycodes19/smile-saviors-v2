import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { RegisterDto } from '../application/dto/register.dto';
import { LoginDto } from '../application/dto/login.dto';
import { CreateStaffDto } from '../application/dto/create-staff.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() userContext: UserContext) {
    return this.authService.getCurrentUser(userContext.email);
  }

  @Post('staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createStaff(@CurrentUser() userContext: UserContext, @Body() createStaffDto: CreateStaffDto) {
    return this.authService.createStaff(userContext.tenantId, createStaffDto);
  }

  @Get('staff')
  @UseGuards(JwtAuthGuard)
  async getStaff(@CurrentUser() userContext: UserContext) {
    return this.authService.getStaff(userContext.tenantId);
  }

  @Get('staff/dentists')
  @UseGuards(JwtAuthGuard)
  async getDentists(@CurrentUser() userContext: UserContext) {
    return this.authService.getDentists(userContext.tenantId);
  }
}
