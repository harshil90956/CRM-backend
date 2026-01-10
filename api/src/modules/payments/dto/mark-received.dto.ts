import { IsDateString, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

export class MarkReceivedDto {
  @IsIn(['Received'])
  status: 'Received';

  @IsDateString()
  paidAt: string;

  @IsOptional()
  @ValidateIf((o) => o.receiptNo !== null && o.receiptNo !== undefined)
  @IsString()
  receiptNo?: string | null;
}
