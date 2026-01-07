import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma/prisma.service';

type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

export type StaffPublic = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class StaffService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(params?: { role?: string }): Promise<ApiSuccess<StaffPublic[]>> {
    const role = params?.role?.trim();

    const staff = await this.prismaService.client.user.findMany({
      where: role ? ({ role: role as any } as any) : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' as any },
    });

    return {
      success: true,
      data: staff as unknown as StaffPublic[],
      message: 'Staff fetched successfully',
    };
  }
}
