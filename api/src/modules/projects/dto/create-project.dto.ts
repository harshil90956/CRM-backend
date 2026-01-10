import { ProjectMainType, ProjectStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsEnum(ProjectMainType)
  mainType?: ProjectMainType;

  @IsOptional()
  @IsString()
  priceRange?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;
}
