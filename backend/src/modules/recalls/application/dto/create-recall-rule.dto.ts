import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateRecallRuleDto {
  @IsString()
  @IsNotEmpty()
  procedureType: string;

  @IsNumber()
  @IsNotEmpty()
  intervalDays: number;

  @IsBoolean()
  @IsOptional()
  recurring?: boolean;

  @IsString()
  @IsOptional()
  reminderText?: string;
}
