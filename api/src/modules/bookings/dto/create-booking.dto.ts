export class CreateBookingDto {
  unitId: string;
  customerId: string;
  projectId: string;
  agentId?: string;
  managerId?: string;
  totalPrice: number;
  tokenAmount: number;
  tenantId: string;
}
