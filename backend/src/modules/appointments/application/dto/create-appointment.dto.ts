import { IsUUID, IsNotEmpty, IsDateString, IsString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsNotEmpty()
  @IsUUID()
  dentistId: string;

  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
