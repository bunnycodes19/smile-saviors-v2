import { RecallRule } from './recall-rule.entity';
import { RecallSchedule } from './recall-schedule.entity';
import { Reminder } from './reminder.entity';

export interface IRecallsRepository {
  createRule(ruleData: Omit<RecallRule, 'id' | 'createdAt'>): Promise<RecallRule>;
  findRulesByTenant(tenantId: string): Promise<RecallRule[]>;
  findRuleById(tenantId: string, id: string): Promise<RecallRule | null>;
  findRuleByProcedureType(tenantId: string, procedureType: string): Promise<RecallRule | null>;
  deleteRule(tenantId: string, id: string): Promise<void>;

  createSchedule(scheduleData: Omit<RecallSchedule, 'id' | 'createdAt' | 'reminderSent' | 'reminderSentAt'>): Promise<RecallSchedule>;
  findScheduleById(tenantId: string, id: string): Promise<RecallSchedule | null>;
  findSchedulesByTenant(
    tenantId: string,
    filters?: { status?: string; overdue?: boolean; dueThisWeek?: boolean },
  ): Promise<RecallSchedule[]>;
  updateSchedule(
    tenantId: string,
    id: string,
    scheduleData: Partial<Omit<RecallSchedule, 'id' | 'tenantId' | 'createdAt'>>,
  ): Promise<RecallSchedule>;

  findSchedulesDue(dueDateBefore: string): Promise<RecallSchedule[]>;
  findUpcomingAppointments(timeWindowStart: Date, timeWindowEnd: Date): Promise<any[]>;
}
