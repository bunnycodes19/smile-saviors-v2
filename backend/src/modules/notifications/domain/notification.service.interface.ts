export interface INotificationService {
  sendWhatsApp(to: string, message: string): Promise<boolean>;
  sendSMS(to: string, message: string): Promise<boolean>;
  sendAppointmentReminder(
    tenantId: string,
    patientId: string,
    patientName: string,
    phone: string,
    appointmentId: string,
    time: Date,
  ): Promise<boolean>;
  sendRecallReminder(
    tenantId: string,
    patientId: string,
    patientName: string,
    phone: string,
    recallId: string,
    procedureType: string,
    dueDate: Date,
  ): Promise<boolean>;
}
