import { Injectable, Inject } from '@nestjs/common';
import { INotificationService } from '../domain/notification.service.interface';
import { DRIZZLE_PROVIDER, NestDrizzleDatabase } from '../../../infrastructure/database/database.provider';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class NotificationService implements INotificationService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NestDrizzleDatabase,
  ) {}

  async sendWhatsApp(to: string, message: string): Promise<boolean> {
    console.log(`[WHATSAPP] Sending message to ${to}: "${message}"`);
    return true;
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    console.log(`[SMS] Sending message to ${to}: "${message}"`);
    return true;
  }

  async sendAppointmentReminder(
    tenantId: string,
    patientId: string,
    patientName: string,
    phone: string,
    appointmentId: string,
    time: Date,
  ): Promise<boolean> {
    const formattedTime = time.toLocaleString();
    const message = `Hello ${patientName}, this is a reminder for your upcoming appointment on ${formattedTime}. Please confirm by replying YES.`;
    
    await this.sendWhatsApp(phone, message);
    
    // Log to reminders table
    await this.db.insert(schema.reminders).values({
      tenantId,
      patientId,
      appointmentId,
      channel: 'whatsapp',
      messageTemplate: message,
      sentAt: new Date(),
      status: 'sent',
    });

    return true;
  }

  async sendRecallReminder(
    tenantId: string,
    patientId: string,
    patientName: string,
    phone: string,
    recallId: string,
    procedureType: string,
    dueDate: Date,
  ): Promise<boolean> {
    const formattedDate = dueDate.toLocaleDateString();
    const message = `Hello ${patientName}, it's time for your follow-up checkup for "${procedureType}". Your due date is ${formattedDate}. Please book an appointment.`;
    
    await this.sendWhatsApp(phone, message);
    
    // Log to reminders table
    await this.db.insert(schema.reminders).values({
      tenantId,
      patientId,
      recallId,
      channel: 'whatsapp',
      messageTemplate: message,
      sentAt: new Date(),
      status: 'sent',
    });

    return true;
  }
}
