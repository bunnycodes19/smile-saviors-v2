export class Appointment {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly dentistId: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    public readonly reason: string,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
