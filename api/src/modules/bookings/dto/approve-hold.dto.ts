import { IsDateString, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

export class ApproveHoldDto {
  @IsIn(['HOLD_CONFIRMED'])
  status: 'HOLD_CONFIRMED';

  @IsDateString()
  approvedAt: string;

  @IsOptional()
  @ValidateIf((o) => o.managerNotes !== null && o.managerNotes !== undefined)
  @IsString()
  managerNotes?: string;
}
