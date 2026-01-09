import { IsDateString, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

export class RejectBookingDto {
  @IsIn(['CANCELLED', 'REFUNDED'])
  status: 'CANCELLED' | 'REFUNDED';

  @IsDateString()
  rejectedAt: string;

  @IsOptional()
  @ValidateIf((o) => o.cancellationReason !== null && o.cancellationReason !== undefined)
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @ValidateIf((o) => o.managerNotes !== null && o.managerNotes !== undefined)
  @IsString()
  managerNotes?: string;
}
