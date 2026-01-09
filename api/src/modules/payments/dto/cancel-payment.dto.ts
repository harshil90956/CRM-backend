import { IsDateString, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CancelPaymentDto {
  @IsIn(['Refunded'])
  status: 'Refunded';

  @IsOptional()
  @ValidateIf((o) => o.refundRefId !== null && o.refundRefId !== undefined)
  @IsString()
  refundRefId?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.notes !== null && o.notes !== undefined)
  @IsString()
  notes?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.paidAt !== null && o.paidAt !== undefined)
  @IsDateString()
  paidAt?: string | null;
}
