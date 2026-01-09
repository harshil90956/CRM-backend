import { LeadPriority, LeadSource } from '@prisma/client';

export class ManagerCreateLeadDto {
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  priority?: LeadPriority;
  budget: string;
  notes?: string;
  projectId?: string;
  assignedToId?: string;
}
