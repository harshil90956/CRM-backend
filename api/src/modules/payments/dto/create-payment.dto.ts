import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  bookingId: string;

  @IsUUID()
  customerId: string;

  @IsUUID()
  unitId: string;

  @IsString()
  tenantId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsIn(['Pending', 'Received', 'Overdue', 'Refunded'])
  status: 'Pending' | 'Received' | 'Overdue' | 'Refunded';

  @IsIn(['Bank_Transfer', 'Cash', 'Cheque', 'Online', 'UPI', 'RTGS', 'Card', 'Net_Banking'])
  method:
    | 'Bank_Transfer'
    | 'Cash'
    | 'Cheque'
    | 'Online'
    | 'UPI'
    | 'RTGS'
    | 'Card'
    | 'Net_Banking';

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  paymentType?: string;

  @IsOptional()
  @IsString()
  receiptNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  refundRefId?: string;
}
