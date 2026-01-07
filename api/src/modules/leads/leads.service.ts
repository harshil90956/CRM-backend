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
        phone: createLeadDto.phone,
        staffId: createLeadDto.staffId,
        customerId: createLeadDto.customerId,
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
        staffId: assignLeadDto.staffId,
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
