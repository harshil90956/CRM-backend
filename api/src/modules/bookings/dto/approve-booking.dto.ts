import { IsDateString, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

export class ApproveBookingDto {
  @IsIn(['BOOKING_CONFIRMED', 'BOOKED'])
  status: 'BOOKING_CONFIRMED' | 'BOOKED';

  @IsDateString()
  approvedAt: string;

  @IsOptional()
  @ValidateIf((o) => o.managerNotes !== null && o.managerNotes !== undefined)
  @IsString()
  managerNotes?: string;
}
