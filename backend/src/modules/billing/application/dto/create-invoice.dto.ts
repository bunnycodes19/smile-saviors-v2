import { IsUUID, IsNotEmpty, IsDateString, IsArray, ValidateNested, IsString, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsOptional()
  @IsUUID()
  treatmentId?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsString()
  unitPrice: string;
}

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}
