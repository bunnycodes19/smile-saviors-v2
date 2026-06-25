import { IsOptional, IsString } from 'class-validator';

export class UpdateClinicSettingsDto {
  @IsOptional()
  @IsString()
  toothNumbering?: string; // fdi | universal | palmer

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;
}
