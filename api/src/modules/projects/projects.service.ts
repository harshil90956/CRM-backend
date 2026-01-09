import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeProject(p: { isClosed: boolean; status: string; units: { status: string }[] } & Record<string, any>) {
    const totalUnits = p.units.length;
    const soldUnits = p.units.filter((u) => u.status === 'SOLD').length;
    const bookedUnits = p.units.filter((u) => u.status === 'BOOKED').length;
    const availableUnits = p.isClosed || p.status === 'CLOSED'
      ? 0
      : p.units.filter((u) => u.status === 'AVAILABLE' || u.status === 'HOLD').length;

    const { units: _units, ...rest } = p;
    return {
      ...rest,
      totalUnits,
      soldUnits,
      bookedUnits,
      availableUnits,
    };
  }

  private readonly projectSelect = {
    id: true,
    name: true,
    location: true,
    mainType: true,
    priceRange: true,
    status: true,
    isClosed: true,
    description: true,
    tenantId: true,
    createdAt: true,
    units: {
      select: {
        status: true,
      },
    },
  } as const;

  async createProject(dto: CreateProjectDto) {
    if (!dto?.name || typeof dto.name !== 'string') {
      throw new BadRequestException('name is required');
    }
    if (!dto?.location || typeof dto.location !== 'string') {
      throw new BadRequestException('location is required');
    }

    const project = await this.prisma.client.project.create({
      data: {
        name: dto.name,
        location: dto.location,
        mainType: dto.mainType,
        priceRange: dto.priceRange,
        status: dto.status,
        isClosed: dto.isClosed,
        description: dto.description,
        tenantId: dto.tenantId,
      },
      select: this.projectSelect,
    });

    return {
      success: true,
      data: this.normalizeProject(project as any),
      message: 'Project created successfully',
    };
  }

  async listProjects() {
    const projects = await this.prisma.client.project.findMany({
      select: this.projectSelect,
      orderBy: { createdAt: 'desc' },
    });

    const normalized = projects.map((p) => this.normalizeProject(p as any));

    return {
      success: true,
      data: normalized,
      message: 'Projects retrieved successfully',
    };
  }

  async updateProject(projectId: string, dto: UpdateProjectDto) {
    const existing = await this.prisma.client.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    const project = await this.prisma.client.project.update({
      where: { id: projectId },
      data: {
        name: dto.name,
        location: dto.location,
        mainType: dto.mainType,
        priceRange: dto.priceRange,
        status: dto.status,
        isClosed: dto.isClosed,
        description: dto.description,
        tenantId: dto.tenantId,
      },
      select: this.projectSelect,
    });

    return {
      success: true,
      data: this.normalizeProject(project as any),
      message: 'Project updated successfully',
    };
  }

  async deleteProject(projectId: string) {
    const existing = await this.prisma.client.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    try {
      await this.prisma.client.project.delete({ where: { id: projectId } });
    } catch (e) {
      const err = e as any;
      if (err?.code === 'P2003') {
        throw new BadRequestException('Project cannot be deleted because it has related records (units/bookings/leads).');
      }
      throw e;
    }
    return {
      success: true,
      data: { id: projectId },
      message: 'Project deleted successfully',
    };
  }
}