import { AuthRole } from '@prisma/client';

export class UpdateUserRoleDto {
  role: AuthRole;
}
