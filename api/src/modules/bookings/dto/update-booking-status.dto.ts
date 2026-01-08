export class UpdateBookingStatusDto {
  status:
    | 'HOLD_REQUESTED'
    | 'HOLD_CONFIRMED'
    | 'BOOKING_PENDING_APPROVAL'
    | 'BOOKING_CONFIRMED'
    | 'PAYMENT_PENDING'
    | 'BOOKED'
    | 'CANCELLED'
    | 'REFUNDED';

  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  managerNotes?: string;
}
