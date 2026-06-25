import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsDateString } from 'class-validator';

export class CreateLabOrderDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  treatmentId?: string;

  @IsOptional()
  @IsString()
  toothNumber?: string;

  @IsNotEmpty()
  @IsString()
  labName: string;

  @IsOptional()
  @IsString()
  labContact?: string;

  @IsNotEmpty()
  @IsString()
  workType: string; // crown | bridge | denture | aligner | etc.

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
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsNumber()
  patientCharge?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
