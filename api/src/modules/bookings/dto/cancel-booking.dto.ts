import { IsDateString, IsIn, IsString } from 'class-validator';

export class CancelBookingDto {
  @IsIn(['CANCELLED'])
  status: 'CANCELLED';

  @IsDateString()
  cancelledAt: string;

  @IsString()
  cancellationReason: string;
}
