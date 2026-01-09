import { ProjectMainType, ProjectStatus } from '@prisma/client';

export class UpdateProjectDto {
  name?: string;
  location?: string;
  mainType?: ProjectMainType;
  priceRange?: string;
  status?: ProjectStatus;
  isClosed?: boolean;
  description?: string;
  tenantId?: string;
}
