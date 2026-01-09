import { LeadPriority, LeadSource } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdminCreateLeadDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @IsEnum(LeadSource)
  source: LeadSource;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsString()
  tenantId: string;
}
