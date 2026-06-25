import { IsOptional, IsString, IsEnum, IsDateString, IsUUID } from 'class-validator';

export class UpdateToothConditionDto {
  @IsOptional()
  @IsString()
  surface?: string;

  @IsOptional()
  @IsString()
  conditionCode?: string;

  @IsOptional()
  @IsEnum(['planned', 'completed'])
  status?: 'planned' | 'completed';

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
