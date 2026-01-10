import { IsIn, IsString } from 'class-validator';

export class AdminUpdateLeadStatusDto {
  @IsString()
  @IsIn(['NEW', 'CONTACTED', 'FOLLOWUP', 'CONVERTED', 'LOST'])
  status: string;
}
