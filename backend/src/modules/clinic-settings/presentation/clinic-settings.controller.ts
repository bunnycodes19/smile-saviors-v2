import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ClinicSettingsService } from '../application/clinic-settings.service';
import { UpdateClinicSettingsDto } from '../application/dto/update-clinic-settings.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('clinic-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicSettingsController {
  constructor(private readonly settingsService: ClinicSettingsService) {}

  @Get()
  async getSettings(@CurrentUser() user: UserContext) {
    return this.settingsService.getSettings(user.tenantId);
  }

  @Put()
  @Roles('ADMIN')
  async updateSettings(@CurrentUser() user: UserContext, @Body() dto: UpdateClinicSettingsDto) {
    return this.settingsService.updateSettings(user.tenantId, dto);
  }
}
