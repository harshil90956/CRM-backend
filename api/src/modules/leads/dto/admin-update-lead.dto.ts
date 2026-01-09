import { LeadPriority, LeadSource } from '@prisma/client';

export class AdminUpdateLeadDto {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  source?: LeadSource;
  priority?: LeadPriority;
  projectId?: string;
  budget?: string;
}
