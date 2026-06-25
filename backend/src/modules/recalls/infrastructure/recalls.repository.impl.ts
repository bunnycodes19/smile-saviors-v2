import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import { IRecallsRepository } from '../domain/recalls.repository.interface';
import { RecallRule } from '../domain/recall-rule.entity';
import { RecallSchedule } from '../domain/recall-schedule.entity';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class RecallsRepositoryImpl implements IRecallsRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  // Rules CRUD
  async createRule(ruleData: Omit<RecallRule, 'id' | 'createdAt'>): Promise<RecallRule> {
    const [row] = await this.db
      .insert(schema.recallRules)
      .values({
        tenantId: ruleData.tenantId,
        procedureType: ruleData.procedureType,
        intervalDays: ruleData.intervalDays,
        recurring: ruleData.recurring,
        reminderText: ruleData.reminderText,
      })
      .returning();
    return this.mapToRuleEntity(row);
  }

  async findRulesByTenant(tenantId: string): Promise<RecallRule[]> {
    const rows = await this.db
      .select()
      .from(schema.recallRules)
      .where(eq(schema.recallRules.tenantId, tenantId));
    return rows.map(r => this.mapToRuleEntity(r));
  }

  async findRuleById(tenantId: string, id: string): Promise<RecallRule | null> {
    const [row] = await this.db
      .select()
      .from(schema.recallRules)
      .where(and(eq(schema.recallRules.tenantId, tenantId), eq(schema.recallRules.id, id)))
      .limit(1);
    return row ? this.mapToRuleEntity(row) : null;
  }

  async findRuleByProcedureType(tenantId: string, procedureType: string): Promise<RecallRule | null> {
    const [row] = await this.db
      .select()
      .from(schema.recallRules)
      .where(
        and(
          eq(schema.recallRules.tenantId, tenantId),
          eq(schema.recallRules.procedureType, procedureType)
        )
      )
      .limit(1);
    return row ? this.mapToRuleEntity(row) : null;
  }

  async deleteRule(tenantId: string, id: string): Promise<void> {
    await this.db
      .delete(schema.recallRules)
      .where(and(eq(schema.recallRules.tenantId, tenantId), eq(schema.recallRules.id, id)));
  }

  // Schedules CRUD
  async createSchedule(scheduleData: Omit<RecallSchedule, 'id' | 'createdAt' | 'reminderSent' | 'reminderSentAt'>): Promise<RecallSchedule> {
    const [row] = await this.db
      .insert(schema.recallSchedules)
      .values({
        tenantId: scheduleData.tenantId,
        patientId: scheduleData.patientId,
        toothNumber: scheduleData.toothNumber,
        sourceTreatmentId: scheduleData.sourceTreatmentId,
        ruleId: scheduleData.ruleId,
        dueDate: scheduleData.dueDate.toISOString().split('T')[0],
        status: scheduleData.status,
      })
      .returning();
    return this.mapToScheduleEntity(row);
  }

  async findScheduleById(tenantId: string, id: string): Promise<RecallSchedule | null> {
    const [row] = await this.db
      .select()
      .from(schema.recallSchedules)
      .where(and(eq(schema.recallSchedules.tenantId, tenantId), eq(schema.recallSchedules.id, id)))
      .limit(1);
    return row ? this.mapToScheduleEntity(row) : null;
  }

  async findSchedulesByTenant(
    tenantId: string,
    filters?: { status?: string; overdue?: boolean; dueThisWeek?: boolean },
  ): Promise<RecallSchedule[]> {
    let whereClause = eq(schema.recallSchedules.tenantId, tenantId);

    if (filters?.status) {
      whereClause = and(whereClause, eq(schema.recallSchedules.status, filters.status)) as any;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (filters?.overdue) {
      whereClause = and(
        whereClause,
        lte(schema.recallSchedules.dueDate, todayStr),
        eq(schema.recallSchedules.status, 'pending')
      ) as any;
    }

    if (filters?.dueThisWeek) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      whereClause = and(
        whereClause,
        gte(schema.recallSchedules.dueDate, todayStr),
        lte(schema.recallSchedules.dueDate, nextWeekStr),
        eq(schema.recallSchedules.status, 'pending')
      ) as any;
    }

    const rows = await this.db
      .select({
        schedule: schema.recallSchedules,
        patientName: sql`concat(${schema.patients.firstName}, ' ', ${schema.patients.lastName})`,
        patientPhone: schema.patients.phone,
        procedureType: schema.recallRules.procedureType,
      })
      .from(schema.recallSchedules)
      .leftJoin(schema.patients, eq(schema.recallSchedules.patientId, schema.patients.id))
      .leftJoin(schema.recallRules, eq(schema.recallSchedules.ruleId, schema.recallRules.id))
      .where(whereClause)
      .orderBy(schema.recallSchedules.dueDate);

    return rows.map(r => this.mapToScheduleEntity(r.schedule, {
      patientName: r.patientName as string,
      patientPhone: r.patientPhone as string,
      procedureType: r.procedureType as string || 'General Follow-up',
    }));
  }

  async updateSchedule(
    tenantId: string,
    id: string,
    scheduleData: Partial<Omit<RecallSchedule, 'id' | 'tenantId' | 'createdAt'>>,
  ): Promise<RecallSchedule> {
    const updateData: any = { ...scheduleData };
    if (scheduleData.dueDate) {
      updateData.dueDate = scheduleData.dueDate.toISOString().split('T')[0];
    }

    const [row] = await this.db
      .update(schema.recallSchedules)
      .set(updateData)
      .where(and(eq(schema.recallSchedules.tenantId, tenantId), eq(schema.recallSchedules.id, id)))
      .returning();

    if (!row) {
      throw new NotFoundException(`Recall Schedule with ID ${id} not found`);
    }

    return this.mapToScheduleEntity(row);
  }

  async findSchedulesDue(dueDateBefore: string): Promise<RecallSchedule[]> {
    const rows = await this.db
      .select({
        schedule: schema.recallSchedules,
        patientName: sql`concat(${schema.patients.firstName}, ' ', ${schema.patients.lastName})`,
        patientPhone: schema.patients.phone,
        procedureType: schema.recallRules.procedureType,
      })
      .from(schema.recallSchedules)
      .leftJoin(schema.patients, eq(schema.recallSchedules.patientId, schema.patients.id))
      .leftJoin(schema.recallRules, eq(schema.recallSchedules.ruleId, schema.recallRules.id))
      .where(
        and(
          lte(schema.recallSchedules.dueDate, dueDateBefore),
          eq(schema.recallSchedules.status, 'pending'),
          eq(schema.recallSchedules.reminderSent, false),
        )
      );

    return rows.map(r => this.mapToScheduleEntity(r.schedule, {
      patientName: r.patientName as string,
      patientPhone: r.patientPhone as string,
      procedureType: r.procedureType as string || 'General Follow-up',
    }));
  }

  async findUpcomingAppointments(timeWindowStart: Date, timeWindowEnd: Date): Promise<any[]> {
    const rows = await this.db
      .select({
        appointment: schema.appointments,
        patientName: sql`concat(${schema.patients.firstName}, ' ', ${schema.patients.lastName})`,
        patientPhone: schema.patients.phone,
      })
      .from(schema.appointments)
      .leftJoin(schema.patients, eq(schema.appointments.patientId, schema.patients.id))
      .where(
        and(
          eq(schema.appointments.status, 'SCHEDULED'),
          gte(schema.appointments.startTime, timeWindowStart),
          lte(schema.appointments.startTime, timeWindowEnd),
        )
      );
    return rows;
  }

  private mapToRuleEntity(row: any): RecallRule {
    return new RecallRule(
      row.id,
      row.tenantId,
      row.procedureType,
      row.intervalDays,
      row.recurring,
      row.reminderText,
      row.createdAt,
    );
  }

  private mapToScheduleEntity(row: any, extra?: { patientName?: string; patientPhone?: string; procedureType?: string }): RecallSchedule {
    return new RecallSchedule(
      row.id,
      row.tenantId,
      row.patientId,
      row.toothNumber ? String(row.toothNumber) : null,
      row.sourceTreatmentId,
      row.ruleId,
      row.dueDate ? new Date(row.dueDate) : new Date(),
      row.status,
      row.reminderSent,
      row.reminderSentAt ? new Date(row.reminderSentAt) : null,
      row.createdAt,
      extra?.patientName,
      extra?.patientPhone,
      extra?.procedureType,
    );
  }
}
