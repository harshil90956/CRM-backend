import { IsDateString, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsIn([
    'HOLD_REQUESTED',
    'HOLD_CONFIRMED',
    'BOOKING_PENDING_APPROVAL',
    'BOOKING_CONFIRMED',
    'PAYMENT_PENDING',
    'BOOKED',
    'CANCELLED',
    'REFUNDED',
  ])
  status:
    | 'HOLD_REQUESTED'
    | 'HOLD_CONFIRMED'
    | 'BOOKING_PENDING_APPROVAL'
    | 'BOOKING_CONFIRMED'
    | 'PAYMENT_PENDING'
    | 'BOOKED'
    | 'CANCELLED'
    | 'REFUNDED';

  @IsOptional()
  @ValidateIf((o) => o.approvedAt !== null && o.approvedAt !== undefined)
  @IsDateString()
  approvedAt?: string;

  @IsOptional()
  @ValidateIf((o) => o.rejectedAt !== null && o.rejectedAt !== undefined)
  @IsDateString()
  rejectedAt?: string;

  @IsOptional()
  @ValidateIf((o) => o.cancelledAt !== null && o.cancelledAt !== undefined)
  @IsDateString()
  cancelledAt?: string;

  @IsOptional()
  @ValidateIf((o) => o.cancellationReason !== null && o.cancellationReason !== undefined)
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @ValidateIf((o) => o.managerNotes !== null && o.managerNotes !== undefined)
  @IsString()
  managerNotes?: string;
}
