import { IsUUID, IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateRadiographDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsNotEmpty()
  @IsString()
  imageType: string;

  @IsOptional()
  @IsString()
  toothNumbers?: string;

  @IsOptional()
  @IsDateString()
  takenDate?: string;

  @IsOptional()
  @IsUUID()
  visitId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
