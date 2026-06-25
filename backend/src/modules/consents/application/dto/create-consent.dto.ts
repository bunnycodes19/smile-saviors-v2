import { IsString, IsNotEmpty, IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class CreateConsentDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsOptional()
  treatmentId?: string;

  @IsUUID()
  @IsNotEmpty()
  templateId: string;

  @IsString()
  @IsNotEmpty()
  signatureData: string; // Base64 signature image

  @IsString()
  @IsNotEmpty()
  signerName: string;

  @IsBoolean()
  @IsNotEmpty()
  isGuardian: boolean;

  @IsString()
  @IsOptional()
  guardianRelation?: string;

  @IsString()
  @IsOptional()
  witnessName?: string;
}
