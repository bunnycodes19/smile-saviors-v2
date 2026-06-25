import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TimelineService } from '../timeline.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { UserContext } from '../../../core/interfaces/request-with-user.interface';

@Controller('timeline')
@UseGuards(JwtAuthGuard)
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get('patient/:patientId')
  async getPatientTimeline(@CurrentUser() user: UserContext, @Param('patientId') patientId: string) {
    return this.timelineService.getPatientTimeline(user.tenantId, patientId);
  }
}
