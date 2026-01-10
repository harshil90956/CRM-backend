import { LeadStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ManagerUpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;
}
