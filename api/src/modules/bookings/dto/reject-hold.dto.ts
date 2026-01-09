import { IsDateString, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

export class RejectHoldDto {
  @IsIn(['CANCELLED'])
  status: 'CANCELLED';

  @IsDateString()
  cancelledAt: string;

  @IsString()
  cancellationReason: string;

  @IsOptional()
  @ValidateIf((o) => o.managerNotes !== null && o.managerNotes !== undefined)
  @IsString()
  managerNotes?: string;
}
