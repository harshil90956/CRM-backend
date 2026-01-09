// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjects(tenantId: string) {
    const projects = await this.prisma.client.project.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        status: true,
        isClosed: true,
        tenantId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: projects, message: 'Projects retrieved successfully' };
  }
}
