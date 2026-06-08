import { IsUUID, IsOptional, IsDateString, IsString } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsUUID()
  dentistId?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
