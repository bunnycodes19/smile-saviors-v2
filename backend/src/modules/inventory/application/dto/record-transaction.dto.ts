import { IsNotEmpty, IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class RecordTransactionDto {
  @IsNotEmpty()
  @IsString()
  type: string; // restock | usage | adjustment

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsUUID()
  relatedTreatmentId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
