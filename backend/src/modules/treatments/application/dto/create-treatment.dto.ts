import { IsUUID, IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export class CreateTreatmentDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  toothNumber?: number;

  @IsNotEmpty()
  @IsString()
  procedureName: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsString()
  price: string;

  @IsNotEmpty()
  @IsEnum(['PLANNED', 'COMPLETED'])
  status: 'PLANNED' | 'COMPLETED';
}
