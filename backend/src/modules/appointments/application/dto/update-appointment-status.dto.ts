import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsNotEmpty()
  @IsString()
  status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}
