import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateDocumentDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsNotEmpty()
  @IsString()
  documentType: string; // medical_history | referral | lab_report | insurance | other

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  tags?: string; // Comma-separated tags e.g. "xray,upper"
}
