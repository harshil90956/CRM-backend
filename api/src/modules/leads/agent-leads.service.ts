import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service.js';
import { AgentCreateLeadDto, AgentUpdateLeadDto, AgentUpdateLeadStatusDto } from './agent-leads.dto.js';

@Injectable()
export class AgentLeadsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly leadSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    status: true,
    priority: true,
    source: true,
    budget: true,
    notes: true,
    createdAt: true,
    project: {
      select: {
        id: true,
        name: true,
      },
    },
    assignedTo: {
      select: {
        id: true,
        name: true,
      },
    },
  } as const;

  private requireDefined(value: unknown, fieldName: string) {
    if (value === undefined || value === null) {
      throw new BadRequestException(`${fieldName} is required`);
    }
  }

  private validateEnum<T extends string>(
    value: unknown,
    allowed: readonly T[],
    fieldName: string,
  ): asserts value is T {
    if (typeof value !== 'string' || !allowed.includes(value as T)) {
      throw new BadRequestException(`${fieldName} must be one of: ${allowed.join(', ')}`);
    }
  }

  private normalizeLeadSource(value: unknown): unknown {
    if (typeof value !== 'string') return value;

    const normalized = value
      .trim()
      .replace(/[-\s]+/g, '_')
      .replace(/[^A-Za-z0-9_]/g, '');

    const allowed = Object.values(LeadSource) as string[];
    if (allowed.includes(normalized)) return normalized;
    return value;
  }

  private async assertProjectExists(projectId: string, tenantId: string) {
    const project = await this.prisma.client.project.findFirst({
      where: { id: projectId, tenantId },
      select: { id: true },
    });

    if (!project) {
      throw new BadRequestException('projectId does not exist');
    }
  }

  private async getOwnedLeadOrThrow(leadId: string, agentId: string, tenantId: string) {
    const lead = await this.prisma.client.lead.findFirst({
      where: {
        id: leadId,
        tenantId,
      },
      select: {
        id: true,
        assignedToId: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.assignedToId !== agentId) {
      throw new ForbiddenException('Forbidden');
    }

    return lead;
  }

  async list(agentId: string, tenantId: string) {
    const leads = await this.prisma.client.lead.findMany({
      where: {
        tenantId,
        assignedToId: agentId,
      },
      select: this.leadSelect,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: leads,
      message: 'Leads retrieved successfully',
    };
  }

  async create(agentId: string, tenantId: string, dto: AgentCreateLeadDto) {
    this.requireDefined(dto.name, 'name');
    this.requireDefined(dto.email, 'email');
    this.requireDefined(dto.phone, 'phone');
    this.requireDefined(dto.source, 'source');
    this.requireDefined(dto.budget, 'budget');

    dto.source = this.normalizeLeadSource(dto.source) as any;
    this.validateEnum(dto.source, Object.values(LeadSource), 'source');
    if (dto.priority !== undefined && dto.priority !== null) {
      this.validateEnum(dto.priority, Object.values(LeadPriority), 'priority');
    }

    if (dto.projectId) {
      await this.assertProjectExists(dto.projectId, tenantId);
    }

    const lead = await this.prisma.client.lead.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        source: dto.source as any,
        priority: dto.priority as any,
        budget: String(dto.budget),
        notes: dto.notes ?? null,
        projectId: dto.projectId ?? null,
        assignedToId: agentId,
        tenantId,
        status: LeadStatus.NEW,
      },
      select: this.leadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead created successfully',
    };
  }

  async update(agentId: string, tenantId: string, leadId: string, dto: AgentUpdateLeadDto) {
    await this.getOwnedLeadOrThrow(leadId, agentId, tenantId);

    if ((dto as any).assignedToId !== undefined && (dto as any).assignedToId !== null) {
      throw new BadRequestException('assignedToId cannot be updated by agent');
    }

    if (dto.source !== undefined) {
      dto.source = this.normalizeLeadSource(dto.source) as any;
      this.validateEnum(dto.source, Object.values(LeadSource), 'source');
    }
    if (dto.priority !== undefined && dto.priority !== null) {
      this.validateEnum(dto.priority, Object.values(LeadPriority), 'priority');
    }

    if (dto.projectId) {
      await this.assertProjectExists(dto.projectId, tenantId);
    }

    const lead = await this.prisma.client.lead.update({
      where: { id: leadId },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        budget: dto.budget,
        notes: dto.notes,
        source: dto.source as any,
        priority: dto.priority as any,
        projectId: dto.projectId ?? undefined,
      },
      select: this.leadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead updated successfully',
    };
  }

  async updateStatus(agentId: string, tenantId: string, leadId: string, dto: AgentUpdateLeadStatusDto) {
    this.requireDefined(dto.status, 'status');
    this.validateEnum(dto.status, Object.values(LeadStatus), 'status');

    await this.getOwnedLeadOrThrow(leadId, agentId, tenantId);

    const lead = await this.prisma.client.lead.update({
      where: { id: leadId },
      data: {
        status: dto.status as any,
      },
      select: this.leadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead status updated successfully',
    };
  }

  async allowedActions(agentId: string, tenantId: string, leadId: string) {
    const lead = await this.prisma.client.lead.findFirst({
      where: { id: leadId, tenantId },
      select: { assignedToId: true },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const owned = lead.assignedToId === agentId;

    return {
      success: true,
      data: {
        canEdit: owned,
        canUpdateStatus: owned,
        canAssign: false,
        canDelete: false,
      },
      message: 'Allowed actions retrieved successfully',
    };
  }
}
