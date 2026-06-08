import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../infrastructure/database/database.provider';
import * as schema from '../../infrastructure/database/schema';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async getStats(tenantId: string): Promise<any> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Total Patients
    const [patientCountRes] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.patients)
      .where(eq(schema.patients.tenantId, tenantId));

    // 2. Today's Appointments
    const [apptCountRes] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.tenantId, tenantId),
          gte(schema.appointments.startTime, todayStart),
          lte(schema.appointments.startTime, todayEnd),
        ),
      );

    // 3. Billing stats (total revenue and outstanding balance)
    const invoices = await this.db
      .select({
        totalAmount: schema.invoices.totalAmount,
        paidAmount: schema.invoices.paidAmount,
      })
      .from(schema.invoices)
      .where(eq(schema.invoices.tenantId, tenantId));

    let totalRevenue = 0;
    let outstandingBills = 0;
    for (const inv of invoices) {
      totalRevenue += Number(inv.paidAmount);
      outstandingBills += Number(inv.totalAmount) - Number(inv.paidAmount);
    }

    // 4. Latest appointments (limit 5)
    const latestAppointments = await this.db
      .select({
        id: schema.appointments.id,
        startTime: schema.appointments.startTime,
        reason: schema.appointments.reason,
        status: schema.appointments.status,
        patientFirstName: schema.patients.firstName,
        patientLastName: schema.patients.lastName,
      })
      .from(schema.appointments)
      .leftJoin(schema.patients, eq(schema.appointments.patientId, schema.patients.id))
      .where(eq(schema.appointments.tenantId, tenantId))
      .orderBy(sql`${schema.appointments.startTime} desc`)
      .limit(5);

    // 5. Weekly Revenue points (aggregated last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const revenueByDay = last7Days.map((dateStr) => {
      return {
        date: dateStr,
        revenue: 0,
      };
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentInvoices = await this.db
      .select({
        paidAmount: schema.invoices.paidAmount,
        createdAt: schema.invoices.createdAt,
      })
      .from(schema.invoices)
      .where(
        and(
          eq(schema.invoices.tenantId, tenantId),
          gte(schema.invoices.createdAt, sevenDaysAgo),
        ),
      );

    for (const inv of recentInvoices) {
      const invDate = new Date(inv.createdAt).toISOString().split('T')[0];
      const match = revenueByDay.find((r) => r.date === invDate);
      if (match) {
        match.revenue += Number(inv.paidAmount);
      }
    }

    return {
      totalPatients: patientCountRes?.count || 0,
      todayAppointments: apptCountRes?.count || 0,
      totalRevenue: totalRevenue.toFixed(2),
      outstandingBills: outstandingBills.toFixed(2),
      latestAppointments,
      revenueHistory: revenueByDay,
    };
  }
}
