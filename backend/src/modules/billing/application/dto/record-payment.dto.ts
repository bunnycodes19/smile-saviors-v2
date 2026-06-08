import { IsNotEmpty, IsString } from 'class-validator';

export class RecordPaymentDto {
  @IsNotEmpty()
  @IsString()
  amount: string;
}
