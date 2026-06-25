import { IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateProcedureDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsOptional()
  toothNumber?: string;

  @IsString()
  @IsNotEmpty()
  procedureType: string; // RCT, Ortho, Implant

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsNumber()
  @IsOptional()
  expectedSittings?: number;

  @IsString()
  @IsOptional()
  totalCost?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
