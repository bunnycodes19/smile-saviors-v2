import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IRecallsRepository } from '../domain/recalls.repository.interface';
import { INotificationService } from '../../notifications/domain/notification.service.interface';
import { CreateRecallRuleDto } from './dto/create-recall-rule.dto';
import { RecallRule } from '../domain/recall-rule.entity';
import { RecallSchedule } from '../domain/recall-schedule.entity';

@Injectable()
export class RecallsService {
  private readonly logger = new Logger(RecallsService.name);

  constructor(
    @Inject('IRecallsRepository')
    private readonly recallsRepository: IRecallsRepository,
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  // Rule management
  async createRule(tenantId: string, dto: CreateRecallRuleDto): Promise<RecallRule> {
    return this.recallsRepository.createRule({
      tenantId,
      procedureType: dto.procedureType,
      intervalDays: dto.intervalDays,
      recurring: dto.recurring ?? false,
      reminderText: dto.reminderText ?? null,
    });
  }

  async findRules(tenantId: string): Promise<RecallRule[]> {
    return this.recallsRepository.findRulesByTenant(tenantId);
  }

  async deleteRule(tenantId: string, id: string): Promise<void> {
    await this.recallsRepository.deleteRule(tenantId, id);
  }

  // Schedule management
  async findSchedules(
    tenantId: string,
    filters?: { status?: string; overdue?: boolean; dueThisWeek?: boolean },
  ): Promise<RecallSchedule[]> {
    return this.recallsRepository.findSchedulesByTenant(tenantId, filters);
  }

  async sendManualReminder(tenantId: string, id: string): Promise<boolean> {
    const schedule = await this.recallsRepository.findScheduleById(tenantId, id);
    if (!schedule) {
      throw new NotFoundException(`Recall Schedule with ID ${id} not found`);
    }

    if (!schedule.patientPhone || !schedule.patientName) {
      throw new Error('Patient contact information missing');
    }

    const success = await this.notificationService.sendRecallReminder(
      tenantId,
      schedule.patientId,
      schedule.patientName,
      schedule.patientPhone,
      schedule.id,
      schedule.procedureType || 'Follow-up',
      schedule.dueDate,
    );

    if (success) {
      await this.recallsRepository.updateSchedule(tenantId, id, {
        reminderSent: true,
        reminderSentAt: new Date(),
      });
    }

    return success;
  }

  async createScheduleFromTreatment(tenantId: string, treatment: any): Promise<void> {
    const rule = await this.recallsRepository.findRuleByProcedureType(tenantId, treatment.procedureName);
    if (!rule) {
      this.logger.log(`No recall rule found for procedure "${treatment.procedureName}"`);
      return;
    }

    const completedDate = treatment.completedAt ? new Date(treatment.completedAt) : new Date();
    const dueDate = new Date(completedDate);
    dueDate.setDate(dueDate.getDate() + rule.intervalDays);

    await this.recallsRepository.createSchedule({
      tenantId,
      patientId: treatment.patientId,
      toothNumber: treatment.toothNumber ? String(treatment.toothNumber) : null,
      sourceTreatmentId: treatment.id,
      ruleId: rule.id,
      dueDate,
      status: 'pending',
    });
    this.logger.log(`Created recall schedule for patient ${treatment.patientId} due on ${dueDate.toISOString()}`);
  }

  // Automated crons
  // Daily 8AM - Remind recalls due in 3 days
  @Cron('0 8 * * *')
  async handleRecallRemindersCron() {
    this.logger.log('Running daily 8AM recall reminders cron job');
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const dateStr = threeDaysFromNow.toISOString().split('T')[0];

    const dueSchedules = await this.recallsRepository.findSchedulesDue(dateStr);
    this.logger.log(`Found ${dueSchedules.length} pending recall schedules due on/before ${dateStr}`);

    for (const schedule of dueSchedules) {
      try {
        if (schedule.patientName && schedule.patientPhone) {
          const success = await this.notificationService.sendRecallReminder(
            schedule.tenantId,
            schedule.patientId,
            schedule.patientName,
            schedule.patientPhone,
            schedule.id,
            schedule.procedureType || 'Follow-up',
            schedule.dueDate,
          );

          if (success) {
            await this.recallsRepository.updateSchedule(schedule.tenantId, schedule.id, {
              reminderSent: true,
              reminderSentAt: new Date(),
            });
          }
        }
      } catch (err: any) {
        this.logger.error(`Failed to send recall reminder for schedule ${schedule.id}: ${err.message}`);
      }
    }
  }

  // Daily 7AM - Remind appointments scheduled for tomorrow (24h reminder)
  @Cron('0 7 * * *')
  async handle24hAppointmentRemindersCron() {
    this.logger.log('Running daily 7AM appointment reminders cron job');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    const appointments = await this.recallsRepository.findUpcomingAppointments(startOfTomorrow, endOfTomorrow);
    this.logger.log(`Found ${appointments.length} appointments scheduled for tomorrow`);

    for (const appt of appointments) {
      try {
        if (appt.patientPhone && appt.patientName) {
          await this.notificationService.sendAppointmentReminder(
            appt.appointment.tenantId,
            appt.appointment.patientId,
            appt.patientName,
            appt.patientPhone,
            appt.appointment.id,
            appt.appointment.startTime,
          );
        }
      } catch (err: any) {
        this.logger.error(`Failed to send appointment reminder for appt ${appt.appointment.id}: ${err.message}`);
      }
    }
  }

  // Every 2 hours - Remind appointments within 2 hours
  @Cron(CronExpression.EVERY_2_HOURS)
  async handle2hAppointmentRemindersCron() {
    this.logger.log('Running 2-hourly appointment reminders cron job');
    const now = new Date();
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

    const appointments = await this.recallsRepository.findUpcomingAppointments(now, twoHoursFromNow);
    this.logger.log(`Found ${appointments.length} appointments starting within next 2 hours`);

    for (const appt of appointments) {
      try {
        if (appt.patientPhone && appt.patientName) {
          await this.notificationService.sendAppointmentReminder(
            appt.appointment.tenantId,
            appt.appointment.patientId,
            appt.patientName,
            appt.patientPhone,
            appt.appointment.id,
            appt.appointment.startTime,
          );
        }
      } catch (err: any) {
        this.logger.error(`Failed to send urgent appointment reminder for appt ${appt.appointment.id}: ${err.message}`);
      }
    }
  }
}
