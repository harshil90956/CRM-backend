import { LeadPriority, LeadSource } from '@prisma/client';

export class AdminCreateLeadDto {
  name: string;
  email: string;
  phone: string;
  notes?: string;
  priority?: LeadPriority;
  source: LeadSource;
  projectId?: string;
  tenantId: string;
}
