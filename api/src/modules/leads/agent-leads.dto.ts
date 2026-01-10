import { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

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

export class AgentLogLeadActivityDto {
  @IsIn(['CALL', 'MEETING', 'EMAIL', 'NOTE'])
  activityType: 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE';

  @IsString()
  notes: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
}
