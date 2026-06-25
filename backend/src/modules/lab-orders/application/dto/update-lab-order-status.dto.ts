import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateLabOrderStatusDto {
  @IsNotEmpty()
  @IsString()
  status: string; // ordered | sent_to_lab | in_progress | received | fitted | rework_needed

  @IsOptional()
  @IsString()
  notes?: string;
}
