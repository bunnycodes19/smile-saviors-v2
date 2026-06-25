import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RecallsService } from '../application/recalls.service';
import { CreateRecallRuleDto } from '../application/dto/create-recall-rule.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('recalls')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecallsController {
  constructor(private readonly recallsService: RecallsService) {}

  @Post('rules')
  @Roles('ADMIN')
  async createRule(@CurrentUser() user: UserContext, @Body() dto: CreateRecallRuleDto) {
    return this.recallsService.createRule(user.tenantId, dto);
  }

  @Get('rules')
  async getRules(@CurrentUser() user: UserContext) {
    return this.recallsService.findRules(user.tenantId);
  }

  @Delete('rules/:id')
  @Roles('ADMIN')
  async deleteRule(@CurrentUser() user: UserContext, @Param('id') id: string) {
    await this.recallsService.deleteRule(user.tenantId, id);
    return { success: true };
  }

  @Get('schedules')
  async getSchedules(
    @CurrentUser() user: UserContext,
    @Query('status') status?: string,
    @Query('overdue') overdue?: string,
    @Query('dueThisWeek') dueThisWeek?: string,
  ) {
    const filters = {
      status,
      overdue: overdue === 'true',
      dueThisWeek: dueThisWeek === 'true',
    };
    return this.recallsService.findSchedules(user.tenantId, filters);
  }

  @Post('schedules/:id/remind')
  @Roles('DENTIST', 'ADMIN', 'RECEPTIONIST')
  async sendManualReminder(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const success = await this.recallsService.sendManualReminder(user.tenantId, id);
    return { success };
  }
}
