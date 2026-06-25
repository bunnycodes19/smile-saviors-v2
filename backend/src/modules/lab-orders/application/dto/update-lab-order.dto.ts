import { IsOptional, IsString, IsNumber, IsDateString, IsUUID } from 'class-validator';

export class UpdateLabOrderDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  treatmentId?: string;

  @IsOptional()
  @IsString()
  toothNumber?: string;

  @IsOptional()
  @IsString()
  labName?: string;

  @IsOptional()
  @IsString()
  labContact?: string;

  @IsOptional()
  @IsString()
  workType?: string;

  @IsOptional()
  @IsString()
  shade?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;

  @IsOptional()
  @IsDateString()
  actualReturnDate?: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsNumber()
  patientCharge?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
