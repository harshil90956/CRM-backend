export class CreatePaymentDto {
  bookingId: string;
  customerId: string;
  unitId: string;
  tenantId: string;

  amount: number;
  status: 'Pending' | 'Received' | 'Overdue' | 'Refunded';
  method:
    | 'Bank_Transfer'
    | 'Cash'
    | 'Cheque'
    | 'Online'
    | 'UPI'
    | 'RTGS'
    | 'Card'
    | 'Net_Banking';

  paymentDate?: string;
  notes?: string;
  type?: string;
  receiptNo?: string;
  refundRefId?: string;
}
