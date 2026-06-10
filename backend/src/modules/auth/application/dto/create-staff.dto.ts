import { IsEmail, IsNotEmpty, IsString, IsIn, MinLength, IsOptional } from 'class-validator';

export class CreateStaffDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsIn(['DENTIST', 'RECEPTIONIST'])
  role: 'DENTIST' | 'RECEPTIONIST';

  @IsOptional()
  @IsString()
  phone?: string;
}
