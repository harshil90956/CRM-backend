export class CreateLeadDto {
  name: string;
  email: string;
  phone: string;
  status?: string;
  source?: string;
  priority?: string;
  budget?: string;
  notes?: string;
  projectId?: string;
  assignedToId?: string;
  tenantId: string;
}
