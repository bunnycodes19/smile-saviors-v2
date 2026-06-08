import { IsString, IsNotEmpty, IsDateString, IsEmail, IsOptional, IsArray } from 'class-validator';

export class CreatePatientDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsDateString()
  dob: string;

  @IsNotEmpty()
  @IsString()
  gender: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

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
