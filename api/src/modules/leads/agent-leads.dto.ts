import { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';

export class AgentCreateLeadDto {
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

export class AgentUpdateLeadDto {
  name?: string;
  email?: string;
  phone?: string;
  budget?: string;
  notes?: string;
  source?: LeadSource;
  priority?: LeadPriority;
  projectId?: string;
  assignedToId?: string;
}

export class AgentUpdateLeadStatusDto {
  status: LeadStatus;
}
