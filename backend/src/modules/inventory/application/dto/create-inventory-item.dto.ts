import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateInventoryItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  category: string; // consumable | material | instrument

  @IsNotEmpty()
  @IsString()
  unit: string; // pieces | ml | grams | boxes

  @IsOptional()
  @IsNumber()
  currentStock?: number;

  @IsOptional()
  @IsNumber()
  reorderThreshold?: number;

  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  supplierContact?: string;
}
