import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { AdminCreateLeadDto } from './dto/admin-create-lead.dto';
import { AdminUpdateLeadDto } from './dto/admin-update-lead.dto';
import { AdminUpdateLeadStatusDto } from './dto/admin-update-lead-status.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { ManagerUpdateLeadStatusDto } from './dto/manager-update-lead-status.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly leadSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    status: true,
    source: true,
    priority: true,
    budget: true,
    notes: true,
    projectId: true,
    assignedToId: true,
    tenantId: true,
    createdAt: true,
  } as const;

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

  private readonly leadSelectNoEmail = {
    id: true,
    name: true,
    phone: true,
    status: true,
    source: true,
    priority: true,
    budget: true,
    notes: true,
    projectId: true,
    assignedToId: true,
    tenantId: true,
    createdAt: true,
  } as const;
  

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

  private async assertProjectExists(projectId: string) {
    const project = await this.prisma.client.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      throw new BadRequestException('projectId does not exist');
    }
  }

  private async assertUserExists(userId: string, fieldName: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new BadRequestException(`${fieldName} does not exist`);
    }
  }

  private async getManagerAgentIds(managerId: string, tenantId: string): Promise<string[]> {
    const agents = await this.prisma.client.user.findMany({
      where: {
        managerId,
        tenantId,
        role: 'AGENT' as any,
      },
      select: { id: true },
    });
    return agents.map((a) => a.id);
  }

  private async assertLeadInManagerScope(managerId: string, tenantId: string, leadId: string) {
    const lead = await this.prisma.client.lead.findFirst({
      where: {
        id: leadId,
        tenantId,
        assignedTo: {
          managerId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  async create(createLeadDto: CreateLeadDto) {
    this.requireDefined(createLeadDto.name, 'name');
    this.requireDefined(createLeadDto.phone, 'phone');
    this.requireDefined(createLeadDto.email, 'email');
    this.requireDefined(createLeadDto.status, 'status');
    this.requireDefined(createLeadDto.source, 'source');
    this.requireDefined(createLeadDto.budget, 'budget');
    this.requireDefined(createLeadDto.tenantId, 'tenantId');

    this.validateEnum(createLeadDto.status, Object.values(LeadStatus), 'status');
    this.validateEnum(createLeadDto.source, Object.values(LeadSource), 'source');
    if (createLeadDto.priority !== undefined && createLeadDto.priority !== null) {
      this.validateEnum(createLeadDto.priority, Object.values(LeadPriority), 'priority');
    }

    if (createLeadDto.projectId) {
      await this.assertProjectExists(createLeadDto.projectId);
    }
    if (createLeadDto.assignedToId) {
      await this.assertUserExists(createLeadDto.assignedToId, 'assignedToId');
    }

    try {
      const lead = await this.prisma.client.lead.create({
        data: {
          name: createLeadDto.name,
          email: createLeadDto.email,
          phone: createLeadDto.phone,
          status: createLeadDto.status,
          source: createLeadDto.source,
          priority: createLeadDto.priority ?? undefined,
          budget: createLeadDto.budget,
          notes: createLeadDto.notes,
          projectId: createLeadDto.projectId,
          assignedToId: createLeadDto.assignedToId,
          tenantId: createLeadDto.tenantId,
        },
        select: this.leadSelect,
      });
      return {
        success: true,
        data: lead,
        message: 'Lead created successfully',
      };
    } catch (e) {
      if (this.isMissingLeadEmailColumn(e)) {
        throw new BadRequestException('Database schema is out of date (missing leads.email). Run prisma db push to sync.');
      }
      throw e;
    }
  }

  async assignLead(id: string, assignLeadDto: AssignLeadDto) {
    this.requireDefined(assignLeadDto.assignedToId, 'assignedToId');
    await this.assertUserExists(assignLeadDto.assignedToId, 'assignedToId');

    const existing = await this.prisma.client.lead.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    let lead: any;

    try {
      lead = await this.prisma.client.lead.update({
        where: { id },
        data: {
          assignedToId: assignLeadDto.assignedToId,
        },
        select: this.leadSelect,
      });
    } catch (e) {
      const err = e as any;
      if (err?.code !== 'P2022' && !this.isMissingLeadEmailColumn(e)) {
        throw e;
      }
      lead = await this.prisma.client.lead.update({
        where: { id },
        data: {
          assignedToId: assignLeadDto.assignedToId,
        },
        select: this.leadSelectNoEmail,
      });
    }

    return {
      success: true,
      data: lead,
      message: 'Lead assigned successfully',
    };
  }

  async findAll() {
    let leads: any[];
    try {
      leads = await this.prisma.client.lead.findMany({
        select: this.leadSelect,
      });
    } catch (e) {
      const err = e as any;
      if (err?.code !== 'P2022' && !this.isMissingLeadEmailColumn(e)) {
        throw e;
      }
      leads = await this.prisma.client.lead.findMany({
        select: this.leadSelectNoEmail,
      });
    }

    return {
      success: true,
      data: leads,
      message: 'Leads retrieved successfully',
    };
  }

  async findAdminLeads() {
    const leads = await this.prisma.client.lead.findMany({
      where: {
        assignedToId: null,
      },
      select: this.leadSelect,
    });

    return {
      success: true,
      data: leads,
      message: 'Leads retrieved successfully',
    };
  }

  async createAdminLead(dto: AdminCreateLeadDto) {
    this.requireDefined(dto.name, 'name');
    this.requireDefined(dto.email, 'email');
    this.requireDefined(dto.phone, 'phone');
    this.requireDefined(dto.source, 'source');
    this.requireDefined(dto.tenantId, 'tenantId');

    this.validateEnum(dto.source, Object.values(LeadSource), 'source');
    if (dto.priority !== undefined && dto.priority !== null) {
      this.validateEnum(dto.priority, Object.values(LeadPriority), 'priority');
    }

    if (dto.projectId) {
      await this.assertProjectExists(dto.projectId);
    }

    const lead = await this.prisma.client.lead.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
        priority: dto.priority ?? undefined,
        source: dto.source,
        projectId: dto.projectId,
        tenantId: dto.tenantId,
        status: LeadStatus.NEW,
        budget: '',
      },
      select: this.leadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead created successfully',
    };
  }

  async updateAdminLead(id: string, dto: AdminUpdateLeadDto) {
    const existing = await this.prisma.client.lead.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    if (dto.source !== undefined && dto.source !== null) {
      this.validateEnum(dto.source, Object.values(LeadSource), 'source');
    }
    if (dto.priority !== undefined && dto.priority !== null) {
      this.validateEnum(dto.priority, Object.values(LeadPriority), 'priority');
    }
    if (dto.projectId) {
      await this.assertProjectExists(dto.projectId);
    }

    const lead = await this.prisma.client.lead.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
        source: dto.source ?? undefined,
        priority: dto.priority ?? undefined,
        projectId: dto.projectId ?? undefined,
        budget: dto.budget ?? undefined,
      },
      select: this.leadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead updated successfully',
    };
  }

  async deleteAdminLead(id: string) {
    const existing = await this.prisma.client.lead.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    const lead = await this.prisma.client.lead.delete({
      where: { id },
      select: this.leadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead deleted successfully',
    };
  }

  async updateAdminLeadStatus(id: string, dto: AdminUpdateLeadStatusDto) {
    this.requireDefined(dto.status, 'status');
    this.validateEnum(dto.status, ['NEW', 'CONTACTED', 'FOLLOWUP', 'CONVERTED', 'LOST'] as const, 'status');

    const existing = await this.prisma.client.lead.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    const lead = await this.prisma.client.lead.update({
      where: { id },
      data: {
        status: dto.status as LeadStatus,
      },
      select: this.leadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead status updated successfully',
    };
  }

  async getAdminLeadsStats() {
    const [total, unassigned, assigned] = await Promise.all([
      this.prisma.client.lead.count(),
      this.prisma.client.lead.count({ where: { assignedToId: null } }),
      this.prisma.client.lead.count({ where: { assignedToId: { not: null } } }),
    ]);

    return {
      success: true,
      data: {
        total,
        unassigned,
        assigned,
      },
      message: 'Leads stats retrieved successfully',
    };
  }

  async findManagerLeads(managerId: string, tenantId: string) {
    const agentIds = await this.getManagerAgentIds(managerId, tenantId);

    if (agentIds.length === 0) {
      return {
        success: true,
        data: [],
        message: 'Leads retrieved successfully',
      };
    }

    const leads = await this.prisma.client.lead.findMany({
      where: {
        tenantId,
        assignedToId: { in: agentIds },
      },
      select: this.managerLeadSelect,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: leads,
      message: 'Leads retrieved successfully',
    };
  }

  async updateManagerLeadStatus(managerId: string, tenantId: string, id: string, dto: ManagerUpdateLeadStatusDto) {
    this.requireDefined(dto.status, 'status');
    this.validateEnum(dto.status, Object.values(LeadStatus), 'status');

    const existing = await this.assertLeadInManagerScope(managerId, tenantId, id);
    const isClosed = existing.status === LeadStatus.CONVERTED || existing.status === LeadStatus.LOST;
    if (isClosed) {
      throw new ForbiddenException('Cannot change status of a closed lead');
    }

    const lead = await this.prisma.client.lead.update({
      where: { id },
      data: {
        status: dto.status as LeadStatus,
      },
      select: this.managerLeadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead status updated successfully',
    };
  }

  async assignManagerLead(managerId: string, tenantId: string, id: string, dto: AssignLeadDto) {
    this.requireDefined(dto.assignedToId, 'assignedToId');

    const existing = await this.assertLeadInManagerScope(managerId, tenantId, id);
    const isClosed = existing.status === LeadStatus.CONVERTED || existing.status === LeadStatus.LOST;
    if (isClosed) {
      throw new ForbiddenException('Cannot assign a closed lead');
    }

    await this.assertUserExists(dto.assignedToId, 'assignedToId');

    const agentIds = await this.getManagerAgentIds(managerId, tenantId);
    if (!agentIds.includes(dto.assignedToId)) {
      throw new ForbiddenException('Cannot assign lead to this agent');
    }

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

  async getManagerLeadStatusList() {
    return {
      success: true,
      data: ['NEW', 'CONTACTED', 'FOLLOWUP', 'NEGOTIATION', 'CONVERTED', 'LOST'],
      message: 'Lead statuses retrieved successfully',
    };
  }

  async getManagerAllowedActions(managerId: string, tenantId: string, id: string) {
    const lead = await this.assertLeadInManagerScope(managerId, tenantId, id);

    const isClosed = lead.status === LeadStatus.CONVERTED || lead.status === LeadStatus.LOST;

    return {
      success: true,
      data: {
        canEdit: !isClosed,
        canAssign: !isClosed,
        canChangeStatus: !isClosed,
        canDelete: false,
      },
      message: 'Allowed actions retrieved successfully',
    };
  }

  async findOne(id: string) {
    let lead: any;
    try {
      lead = await this.prisma.client.lead.findUnique({
        where: { id },
        select: this.leadSelect,
      });
    } catch (e) {
      const err = e as any;
      if (err?.code !== 'P2022' && !this.isMissingLeadEmailColumn(e)) {
        throw e;
      }
      lead = await this.prisma.client.lead.findUnique({
        where: { id },
        select: this.leadSelectNoEmail,
      });
    }

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return {
      success: true,
      data: lead,
      message: 'Lead retrieved successfully',
    };
  }

  private parseCsvText(text: string): Record<string, string>[] {
    const lines = text
      .split(/\r\n|\n|\r/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      return [];
    }

    const parseLine = (line: string): string[] => {
      const out: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === '"') {
          const next = line[i + 1];
          if (inQuotes && next === '"') {
            current += '"';
            i += 1;
          } else {
            inQuotes = !inQuotes;
          }
          continue;
        }
        if (ch === ',' && !inQuotes) {
          out.push(current.trim());
          current = '';
          continue;
        }
        current += ch;
      }
      out.push(current.trim());
      return out;
    };

    const headers = parseLine(lines[0]).map((h) => h.trim());
    const normalizedHeaders = headers.map((h) => h.replace(/^\uFEFF/, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i += 1) {
      const cols = parseLine(lines[i]);
      const row: Record<string, string> = {};
      normalizedHeaders.forEach((h, idx) => {
        row[h] = (cols[idx] ?? '').trim();
      });
      rows.push(row);
    }

    return rows;
  }

  async importCsv(buffer: Buffer) {
    const text = buffer.toString('utf8');
    const rows = this.parseCsvText(text);

    const total = rows.length;
    if (total === 0) {
      return {
        success: true,
        data: { total: 0, created: 0, skipped: 0 },
        message: 'Leads imported successfully',
      };
    }

    const allowedStatus = Object.values(LeadStatus);
    const allowedSource = Object.values(LeadSource);
    const allowedPriority = Object.values(LeadPriority);

    type Candidate = {
      name: string;
      phone: string;
      email: string;
      status: LeadStatus;
      source: LeadSource;
      budget: string;
      tenantId: string;
      priority?: LeadPriority;
      notes?: string;
      projectId?: string;
      assignedToId?: string;
    };

    const candidates: Candidate[] = [];
    const phoneSeenInCsv = new Set<string>();

    const pick = (row: Record<string, string>, key: string) => {
      return (row[key] ?? row[key.toLowerCase()] ?? '').trim();
    };

    for (const row of rows) {
      const name = pick(row, 'name');
      const phone = pick(row, 'phone');
      const email = pick(row, 'email');
      const statusRaw = pick(row, 'status');
      const sourceRaw = pick(row, 'source');
      const budget = pick(row, 'budget');
      const tenantId = pick(row, 'tenantId');
      const priorityRaw = pick(row, 'priority');
      const notes = pick(row, 'notes');
      const projectId = pick(row, 'projectId');
      const assignedToId = pick(row, 'assignedToId');

      if (!name || !phone || !email || !statusRaw || !sourceRaw || !budget || !tenantId) {
        continue;
      }

      if (phoneSeenInCsv.has(phone)) {
        continue;
      }

      if (!allowedStatus.includes(statusRaw as LeadStatus)) {
        continue;
      }
      if (!allowedSource.includes(sourceRaw as LeadSource)) {
        continue;
      }

      let priority: LeadPriority | undefined;
      if (priorityRaw) {
        if (!allowedPriority.includes(priorityRaw as LeadPriority)) {
          continue;
        }
        priority = priorityRaw as LeadPriority;
      }

      phoneSeenInCsv.add(phone);
      candidates.push({
        name,
        phone,
        email,
        status: statusRaw as LeadStatus,
        source: sourceRaw as LeadSource,
        budget,
        tenantId,
        priority,
        notes: notes || undefined,
        projectId: projectId || undefined,
        assignedToId: assignedToId || undefined,
      });
    }

    if (candidates.length === 0) {
      return {
        success: true,
        data: { total, created: 0, skipped: total },
        message: 'Leads imported successfully',
      };
    }

    const phones = [...new Set(candidates.map((c) => c.phone))];
    const existingPhones = await this.prisma.client.lead.findMany({
      where: { phone: { in: phones } },
      select: { phone: true },
    });
    const existingPhoneSet = new Set(existingPhones.map((p) => p.phone));

    const projectIds = [...new Set(candidates.map((c) => c.projectId).filter(Boolean) as string[])];
    const userIds = [...new Set(candidates.map((c) => c.assignedToId).filter(Boolean) as string[])];

    const [projects, users] = await Promise.all([
      projectIds.length
        ? this.prisma.client.project.findMany({ where: { id: { in: projectIds } }, select: { id: true } })
        : Promise.resolve([] as { id: string }[]),
      userIds.length
        ? this.prisma.client.user.findMany({ where: { id: { in: userIds } }, select: { id: true } })
        : Promise.resolve([] as { id: string }[]),
    ]);

    const projectIdSet = new Set(projects.map((p) => p.id));
    const userIdSet = new Set(users.map((u) => u.id));

    const toCreate = candidates.filter((c) => {
      if (existingPhoneSet.has(c.phone)) return false;
      if (c.projectId && !projectIdSet.has(c.projectId)) return false;
      if (c.assignedToId && !userIdSet.has(c.assignedToId)) return false;
      return true;
    });

    const created = await this.prisma.client.$transaction(async (tx) => {
      const res = await tx.lead.createMany({
        data: toCreate.map((c) => ({
          name: c.name,
          phone: c.phone,
          email: c.email,
          status: c.status,
          source: c.source,
          budget: c.budget,
          priority: c.priority,
          notes: c.notes,
          projectId: c.projectId,
          assignedToId: c.assignedToId,
          tenantId: c.tenantId,
        })),
      });
      return res.count;
    });

    return {
      success: true,
      data: {
        total,
        created,
        skipped: total - created,
      },
      message: 'Leads imported successfully',
    };
  }
}
