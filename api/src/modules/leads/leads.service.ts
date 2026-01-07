import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLeadDto: CreateLeadDto) {
    const lead = await this.prisma.client.lead.create({
      data: {
        name: createLeadDto.name,
        email: createLeadDto.email,
        phone: createLeadDto.phone,
        status: (createLeadDto.status as any) ?? 'NEW',
        source: (createLeadDto.source as any) ?? 'Website',
        priority: createLeadDto.priority as any,
        budget: createLeadDto.budget ?? '',
        notes: createLeadDto.notes,
        projectId: createLeadDto.projectId,
        assignedToId: createLeadDto.assignedToId,
        tenantId: createLeadDto.tenantId,
      },
    });

    return {
      success: true,
      data: lead,
      message: 'Lead created successfully',
    };
  }

  async assignLead(id: string, assignLeadDto: AssignLeadDto) {
    const lead = await this.prisma.client.lead.update({
      where: { id },
      data: {
        assignedToId: assignLeadDto.assignedToId,
      },
    });

    return {
      success: true,
      data: lead,
      message: 'Lead assigned successfully',
    };
  }

  async findAll() {
    const leads = await this.prisma.client.lead.findMany();

    return {
      success: true,
      data: leads,
      message: 'Leads retrieved successfully',
    };
  }
}
