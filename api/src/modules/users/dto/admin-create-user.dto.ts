import { AuthRole } from '@prisma/client';

export class AdminCreateUserDto {
  name: string;
  email: string;
  phone?: string;
  role: AuthRole;
  managerId?: string;
  tenantId?: string;
}
