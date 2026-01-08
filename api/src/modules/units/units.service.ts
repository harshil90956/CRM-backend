// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma/prisma.service';

type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

@Injectable()
export class UnitsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<ApiSuccess<unknown[]>> {
    const units = await this.prismaService.client.unit.findMany({
      select: {
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
        project: {
          select: {
            name: true,
            mainType: true,
          },
        },
      },
    });

    return {
      success: true,
      data: units.map((u: any) => ({
        ...u,
        project: u?.project?.name,
        mainType: u?.project?.mainType,
      })),
      message: 'Units fetched successfully',
    };
  }
}
