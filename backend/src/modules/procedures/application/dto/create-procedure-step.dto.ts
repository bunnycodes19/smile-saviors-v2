import { IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateProcedureStepDto {
  @IsUUID()
  @IsOptional()
  visitId?: string;

  @IsNumber()
  @IsNotEmpty()
  stepNumber: number;

  @IsString()
  @IsNotEmpty()
  stepDescription: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  dentistNotes?: string;

  @IsString()
  @IsOptional()
  costForStep?: string;

  @IsString()
  @IsOptional()
  status?: string; // pending | completed
}
