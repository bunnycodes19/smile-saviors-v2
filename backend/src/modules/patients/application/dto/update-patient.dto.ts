import { IsString, IsOptional, IsDateString, IsEmail, IsArray } from 'class-validator';

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicalHistory?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];
}
