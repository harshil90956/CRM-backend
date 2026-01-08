export class CreateBookingDto {
  unitId: string;
  customerId: string;
  projectId: string;
  tenantId: string;

  totalPrice: number;
  tokenAmount: number;

  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  agentId?: string;
  managerId?: string;
}
