// TODO: Implemented in Phase 7+ after domain blueprint approval

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UnitStatus } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma/prisma.service';

type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

@Injectable()
export class UnitsService {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly unitSelect = {
    id: true,
    unitNo: true,
    projectId: true,
    status: true,
    price: true,
    bedrooms: true,
    bathrooms: true,
    floorNumber: true,
    towerName: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
    project: {
      select: {
        name: true,
        mainType: true,
      },
    },
  } as const;

  private normalizeUnit(u: any) {
    return {
      ...u,
      project: u?.project?.name,
      mainType: u?.project?.mainType,
    };
  }

  async findAll(): Promise<ApiSuccess<unknown[]>> {
    const units = await this.prismaService.client.unit.findMany({
      select: this.unitSelect,
    });

    return {
      success: true,
      data: units.map((u: any) => this.normalizeUnit(u)),
      message: 'Units fetched successfully',
    };
  }

  async create(body: Record<string, unknown>): Promise<ApiSuccess<unknown>> {
    const unitNo = typeof body.unitNo === 'string' ? body.unitNo.trim() : '';
    const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
    const status = typeof body.status === 'string' ? body.status : '';
    const price = typeof body.price === 'number' ? body.price : Number(body.price);

    if (!unitNo) throw new BadRequestException('unitNo is required');
    if (!projectId) throw new BadRequestException('projectId is required');
    if (!Object.values(UnitStatus).includes(status as UnitStatus)) {
      throw new BadRequestException('Invalid status');
    }
    if (!Number.isFinite(price) || price <= 0) {
      throw new BadRequestException('Invalid price');
    }

    const project = await this.prismaService.client.project.findUnique({
      where: { id: projectId },
      select: { tenantId: true },
    });
    if (!project) throw new BadRequestException('Invalid projectId');

    const unit = await this.prismaService.client.unit.create({
      data: {
        unitNo,
        projectId,
        status: status as UnitStatus,
        price,
        bedrooms: typeof body.bedrooms === 'number' ? body.bedrooms : (body.bedrooms ? Number(body.bedrooms) : undefined),
        bathrooms: typeof body.bathrooms === 'number' ? body.bathrooms : (body.bathrooms ? Number(body.bathrooms) : undefined),
        floorNumber: typeof body.floorNumber === 'number' ? body.floorNumber : (body.floorNumber ? Number(body.floorNumber) : undefined),
        towerName: typeof body.towerName === 'string' ? body.towerName : undefined,
        tenantId: project.tenantId,
      },
      select: this.unitSelect,
    });

    return {
      success: true,
      data: this.normalizeUnit(unit as any),
      message: 'Unit created successfully',
    };
  }

  async update(id: string, body: Record<string, unknown>): Promise<ApiSuccess<unknown>> {
    if (!id || typeof id !== 'string') throw new BadRequestException('Invalid id');

    const existing = await this.prismaService.client.unit.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Unit not found');

    const data: Record<string, unknown> = {};

    if (typeof body.unitNo === 'string') data.unitNo = body.unitNo.trim();

    if (typeof body.status === 'string') {
      if (!Object.values(UnitStatus).includes(body.status as UnitStatus)) {
        throw new BadRequestException('Invalid status');
      }
      data.status = body.status;
    }

    if (body.price !== undefined) {
      const price = typeof body.price === 'number' ? body.price : Number(body.price);
      if (!Number.isFinite(price) || price <= 0) throw new BadRequestException('Invalid price');
      data.price = price;
    }

    if (body.bedrooms !== undefined) data.bedrooms = typeof body.bedrooms === 'number' ? body.bedrooms : Number(body.bedrooms);
    if (body.bathrooms !== undefined) data.bathrooms = typeof body.bathrooms === 'number' ? body.bathrooms : Number(body.bathrooms);
    if (body.floorNumber !== undefined) data.floorNumber = typeof body.floorNumber === 'number' ? body.floorNumber : Number(body.floorNumber);
    if (typeof body.towerName === 'string') data.towerName = body.towerName;

    if (typeof body.projectId === 'string' && body.projectId.trim()) {
      const nextProject = await this.prismaService.client.project.findUnique({
        where: { id: body.projectId.trim() },
        select: { id: true, tenantId: true },
      });
      if (!nextProject) throw new BadRequestException('Invalid projectId');
      data.projectId = nextProject.id;
      data.tenantId = nextProject.tenantId;
    }

    const unit = await this.prismaService.client.unit.update({
      where: { id },
      data: data as any,
      select: this.unitSelect,
    });

    return {
      success: true,
      data: this.normalizeUnit(unit as any),
      message: 'Unit updated successfully',
    };
  }
}
