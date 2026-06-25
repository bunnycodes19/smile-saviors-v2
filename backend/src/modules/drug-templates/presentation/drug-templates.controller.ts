import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DrugTemplatesService } from '../application/drug-templates.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('drug-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DrugTemplatesController {
  constructor(private readonly drugTemplatesService: DrugTemplatesService) {}

  @Post()
  @Roles('ADMIN')
  async create(
    @CurrentUser() user: UserContext,
    @Body() body: {
      name: string;
      genericName?: string;
      category?: string;
      defaultDosage?: string;
      defaultFrequency?: string;
      defaultDuration?: number;
      defaultInstructions?: string;
      contraindications?: string[];
    },
  ) {
    return this.drugTemplatesService.create(user.tenantId, body);
  }

  @Get()
  async findAll(@CurrentUser() user: UserContext) {
    return this.drugTemplatesService.findAll(user.tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async delete(@CurrentUser() user: UserContext, @Param('id') id: string) {
    await this.drugTemplatesService.delete(user.tenantId, id);
    return { success: true };
  }
}
