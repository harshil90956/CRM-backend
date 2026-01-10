import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service.js';
import { LeadPermissionsService } from './lead-permissions.service';
import { AssignLeadDto } from './dto/assign-lead.dto.js';
import { ManagerCreateLeadDto } from './dto/manager-create-lead.dto.js';
import { ManagerUpdateLeadStatusDto } from './dto/manager-update-lead-status.dto.js';
import { ManagerUpdateLeadDto } from './dto/manager-update-lead.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('manager/leads')
export class ManagerLeadsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadPermissionsService: LeadPermissionsService,
  ) {}

  private readonly managerLeadSelect = {
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

  private readonly managerLeadSelectNoEmail = {
    id: true,
    name: true,
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

  private getPayload(req: Request): JwtPayload {
    const payload = req.user as JwtPayload | undefined;
    if (!payload?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    if (payload.role !== 'MANAGER') {
      throw new ForbiddenException('Forbidden');
    }
    return payload;
  }

  private isMissingLeadEmailColumn(e: unknown): boolean {
    const err = e as any;
    if (err?.code !== 'P2022') return false;

    const column = typeof err?.meta?.column === 'string' ? (err.meta.column as string) : '';
    const modelName = typeof err?.meta?.modelName === 'string' ? (err.meta.modelName as string) : '';

    const normalized = column.toLowerCase();

    if (modelName === 'Lead' && normalized.includes('email')) return true;
    if (normalized.endsWith('.email') && (normalized.includes('lead') || normalized.includes('leads'))) return true;

    return false;
  }

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

  private async assertAgentExists(agentId: string, tenantId: string, fieldName: string) {
    const agent = await this.prisma.client.user.findFirst({
      where: {
        id: agentId,
        tenantId,
        role: 'AGENT' as any,
        isActive: true,
      },
      select: { id: true },
    });
    if (!agent) {
      throw new BadRequestException(`${fieldName} does not exist`);
    }
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

  private async getLeadInTenantOrThrow(id: string, tenantId: string) {
    const lead = await this.prisma.client.lead.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  @Get()
  async list(@Req() req: Request) {
    const payload = this.getPayload(req);
    let leads: any[];
    try {
      leads = await this.prisma.client.lead.findMany({
        where: { tenantId: payload.tenantId },
        select: this.managerLeadSelect,
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      const err = e as any;
      if (err?.code !== 'P2022' && !this.isMissingLeadEmailColumn(e)) {
        throw e;
      }
      leads = await this.prisma.client.lead.findMany({
        where: { tenantId: payload.tenantId },
        select: this.managerLeadSelectNoEmail,
        orderBy: { createdAt: 'desc' },
      });
    }

    return {
      success: true,
      data: leads,
      message: 'Leads retrieved successfully',
    };
  }

  @Get('agents')
  async agents(@Req() req: Request) {
    const payload = this.getPayload(req);

    const agents = await this.prisma.client.user.findMany({
      where: {
        tenantId: payload.tenantId,
        role: 'AGENT' as any,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { createdAt: 'asc' as any },
    });

    return {
      success: true,
      data: agents,
      message: 'Agents retrieved successfully',
    };
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: ManagerCreateLeadDto) {
    const payload = this.getPayload(req);

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
      await this.assertProjectExists(dto.projectId, payload.tenantId);
    }
    if (dto.assignedToId) {
      await this.assertAgentExists(dto.assignedToId, payload.tenantId, 'assignedToId');
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
        assignedToId: dto.assignedToId ?? null,
        tenantId: payload.tenantId,
        status: LeadStatus.NEW,
      },
      select: this.managerLeadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead created successfully',
    };
  }

  @Patch(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: ManagerUpdateLeadDto) {
    const payload = this.getPayload(req);

    const existing = await this.getLeadInTenantOrThrow(id, payload.tenantId);
    const isClosed = existing.status === LeadStatus.CONVERTED || existing.status === LeadStatus.LOST;
    if (isClosed) {
      throw new ForbiddenException('Cannot edit a closed lead');
    }

    if (dto.source !== undefined) {
      dto.source = this.normalizeLeadSource(dto.source) as any;
      this.validateEnum(dto.source, Object.values(LeadSource), 'source');
    }
    if (dto.priority !== undefined && dto.priority !== null) {
      this.validateEnum(dto.priority, Object.values(LeadPriority), 'priority');
    }

    const nextAssignedToId = (dto as any)?.assignedToId as string | undefined;
    if (nextAssignedToId) {
      await this.assertAgentExists(nextAssignedToId, payload.tenantId, 'assignedToId');
    }
    if (dto.projectId) {
      await this.assertProjectExists(dto.projectId, payload.tenantId);
    }

    const lead = await this.prisma.client.lead.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        source: dto.source as any,
        priority: dto.priority as any,
        budget: dto.budget,
        notes: dto.notes,
        projectId: dto.projectId ?? undefined,
        assignedToId: nextAssignedToId ?? undefined,
      },
      select: this.managerLeadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead updated successfully',
    };
  }

  @Patch(':id/status')
  async updateStatus(@Req() req: Request, @Param('id') id: string, @Body() dto: ManagerUpdateLeadStatusDto) {
    const payload = this.getPayload(req);

    this.requireDefined(dto.status, 'status');
    this.validateEnum(dto.status, Object.values(LeadStatus), 'status');

    const existing = await this.getLeadInTenantOrThrow(id, payload.tenantId);
    const isClosed = existing.status === LeadStatus.CONVERTED || existing.status === LeadStatus.LOST;
    if (isClosed) {
      throw new ForbiddenException('Cannot change status of a closed lead');
    }

    const lead = await this.prisma.client.lead.update({
      where: { id },
      data: {
        status: dto.status as any,
      },
      select: this.managerLeadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead status updated successfully',
    };
  }

  @Patch(':id/assign')
  async assign(@Req() req: Request, @Param('id') id: string, @Body() dto: AssignLeadDto) {
    const payload = this.getPayload(req);

    this.requireDefined(dto.assignedToId, 'assignedToId');

    const existing = await this.getLeadInTenantOrThrow(id, payload.tenantId);
    const isClosed = existing.status === LeadStatus.CONVERTED || existing.status === LeadStatus.LOST;
    if (isClosed) {
      throw new ForbiddenException('Cannot assign a closed lead');
    }

    await this.assertAgentExists(dto.assignedToId, payload.tenantId, 'assignedToId');

    const lead = await this.prisma.client.lead.update({
      where: { id },
      data: {
        assignedToId: dto.assignedToId,
      },
      select: this.managerLeadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead assigned successfully',
    };
  }

  @Get('status')
  async statusList() {
    return {
      success: true,
      data: ['NEW', 'CONTACTED', 'FOLLOWUP', 'NEGOTIATION', 'CONVERTED', 'LOST'],
      message: 'Lead statuses retrieved successfully',
    };
  }

  @Get('allowed-actions/:id')
  async allowedActions(@Req() req: Request, @Param('id') id: string) {
    const payload = this.getPayload(req);

    const lead = await this.getLeadInTenantOrThrow(id, payload.tenantId);
    const isClosed = lead.status === LeadStatus.CONVERTED || lead.status === LeadStatus.LOST;

    const cfg = this.leadPermissionsService.getConfig();

    return {
      success: true,
      data: {
        canEdit: !isClosed && cfg.managerCanEdit,
        canAssign: !isClosed,
        canChangeStatus: !isClosed,
        canDelete: !isClosed && cfg.managerCanDelete,
      },
      message: 'Allowed actions retrieved successfully',
    };
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const payload = this.getPayload(req);

    const lead = await this.getLeadInTenantOrThrow(id, payload.tenantId);
    const isClosed = lead.status === LeadStatus.CONVERTED || lead.status === LeadStatus.LOST;

    const cfg = this.leadPermissionsService.getConfig();
    if (isClosed) {
      throw new ForbiddenException('Cannot delete a closed lead');
    }
    if (!cfg.managerCanDelete) {
      throw new ForbiddenException('Deleting leads is disabled for managers');
    }

    const deleted = await this.prisma.client.lead.delete({
      where: { id },
      select: this.managerLeadSelect,
    });

    return {
      success: true,
      data: deleted,
      message: 'Lead deleted successfully',
    };
  }
}
