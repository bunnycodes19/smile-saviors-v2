import { IsUUID, IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateToothConditionDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsNotEmpty()
  @IsString()
  toothNumber: string;

  @IsOptional()
  @IsString()
  surface?: string;

  @IsNotEmpty()
  @IsString()
  conditionCode: string;

  @IsNotEmpty()
  @IsEnum(['planned', 'completed'])
  status: 'planned' | 'completed';

  @IsOptional()
  @IsDateString()
  dateRecorded?: string;

  @IsOptional()
  @IsUUID()
  visitId?: string;

  @IsOptional()
  @IsUUID()
  dentistId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
