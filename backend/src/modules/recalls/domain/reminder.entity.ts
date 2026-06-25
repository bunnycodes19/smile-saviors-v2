export class Reminder {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly appointmentId: string | null,
    public readonly recallId: string | null,
    public readonly channel: string, // whatsapp | sms | email
    public readonly messageTemplate: string | null,
    public readonly sentAt: Date | null,
    public readonly status: string, // pending | sent | delivered | failed
    public readonly patientResponse: string | null, // CONFIRM | CANCEL | RESCHEDULE
    public readonly createdAt: Date,
  ) {}
}
