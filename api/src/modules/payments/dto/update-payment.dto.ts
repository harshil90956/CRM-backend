import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class UpdatePaymentDto {
  @IsOptional()
  @IsIn(['Pending', 'Received', 'Overdue', 'Refunded'])
  status?: 'Pending' | 'Received' | 'Overdue' | 'Refunded';

  @IsOptional()
  @IsIn(['Bank_Transfer', 'Cash', 'Cheque', 'Online', 'UPI', 'RTGS', 'Card', 'Net_Banking'])
  method?:
    | 'Bank_Transfer'
    | 'Cash'
    | 'Cheque'
    | 'Online'
    | 'UPI'
    | 'RTGS'
    | 'Card'
    | 'Net_Banking';

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @ValidateIf((o) => o.paidAt !== null && o.paidAt !== undefined)
  @IsDateString()
  paidAt?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.paymentType !== null && o.paymentType !== undefined)
  @IsString()
  paymentType?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.receiptNo !== null && o.receiptNo !== undefined)
  @IsString()
  receiptNo?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.notes !== null && o.notes !== undefined)
  @IsString()
  notes?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.refundRefId !== null && o.refundRefId !== undefined)
  @IsString()
  refundRefId?: string | null;
}
