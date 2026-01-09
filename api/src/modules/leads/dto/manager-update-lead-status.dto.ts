import { LeadStatus } from '@prisma/client';

export class ManagerUpdateLeadStatusDto {
  status: LeadStatus;
}
