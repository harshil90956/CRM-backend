import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';

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
  }

  async assignLead(id: string, assignLeadDto: AssignLeadDto) {
    this.requireDefined(assignLeadDto.assignedToId, 'assignedToId');
    await this.assertUserExists(assignLeadDto.assignedToId, 'assignedToId');

    const existing = await this.prisma.client.lead.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    const lead = await this.prisma.client.lead.update({
      where: { id },
      data: {
        assignedToId: assignLeadDto.assignedToId,
      },
      select: this.leadSelect,
    });

    return {
      success: true,
      data: lead,
      message: 'Lead assigned successfully',
    };
  }

  async findAll() {
    const leads = await this.prisma.client.lead.findMany({
      select: this.leadSelect,
    });

    return {
      success: true,
      data: leads,
      message: 'Leads retrieved successfully',
    };
  }

  async findOne(id: string) {
    const lead = await this.prisma.client.lead.findUnique({
      where: { id },
      select: this.leadSelect,
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return {
      success: true,
      data: lead,
      message: 'Lead retrieved successfully',
    };
  }
}
