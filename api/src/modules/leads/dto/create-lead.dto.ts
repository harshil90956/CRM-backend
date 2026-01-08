import { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';

export class CreateLeadDto {
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  priority?: LeadPriority;
  budget: string;
  notes?: string;
  projectId?: string;
  assignedToId?: string;
  tenantId: string;
}
