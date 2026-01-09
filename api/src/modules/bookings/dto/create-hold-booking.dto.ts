import { IsDateString, IsEmail, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateIf } from 'class-validator';

export class CreateHoldBookingDto {
  @IsUUID()
  unitId: string;

  @IsUUID()
  customerId: string;

  @IsUUID()
  projectId: string;

  @IsString()
  tenantId: string;

  @IsNumber()
  @Min(0.01)
  totalPrice: number;

  @IsNumber()
  @Min(0.01)
  tokenAmount: number;

  @IsIn(['HOLD_REQUESTED'])
  status: 'HOLD_REQUESTED';

  @IsOptional()
  @ValidateIf((o) => o.holdExpiresAt !== null && o.holdExpiresAt !== undefined)
  @IsDateString()
  holdExpiresAt?: string;

  @IsString()
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsString()
  customerPhone: string;

  @IsOptional()
  @ValidateIf((o) => o.notes !== null && o.notes !== undefined)
  @IsString()
  notes?: string;

  @IsOptional()
  @ValidateIf((o) => o.agentId !== null && o.agentId !== undefined)
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @ValidateIf((o) => o.managerId !== null && o.managerId !== undefined)
  @IsUUID()
  managerId?: string;
}
