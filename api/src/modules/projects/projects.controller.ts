// TODO: Implemented in Phase 7+ after domain blueprint approval

import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  private getPayload(req: Request): JwtPayload {
    const payload = req.user as JwtPayload | undefined;
    if (!payload?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    if (payload.role !== 'ADMIN' && payload.role !== 'MANAGER') {
      throw new ForbiddenException('Forbidden');
    }
    return payload;
  }

  @Get()
  async list(@Req() req: Request) {
    const payload = this.getPayload(req);
    return this.projectsService.listProjects(payload.tenantId);
  }
}
