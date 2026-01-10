import { Body, Controller, Get, Patch, Req, UnauthorizedException, ForbiddenException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { LeadPermissionsService } from './lead-permissions.service';
import { UpdateLeadPermissionsDto } from './dto/update-lead-permissions.dto';

@UseGuards(JwtAuthGuard)
@Controller('admin/settings/lead-permissions')
export class LeadPermissionsController {
  constructor(private readonly leadPermissionsService: LeadPermissionsService) {}

  private getPayload(req: Request): JwtPayload {
    const payload = req.user as JwtPayload | undefined;
    if (!payload?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Forbidden');
    }
    return payload;
  }

  @Get()
  get(@Req() req: Request) {
    this.getPayload(req);
    return {
      success: true,
      data: this.leadPermissionsService.getConfig(),
      message: 'Lead permissions loaded successfully',
    };
  }

  @Patch()
  update(@Req() req: Request, @Body() dto: UpdateLeadPermissionsDto) {
    this.getPayload(req);
    const next = this.leadPermissionsService.updateConfig({
      managerCanEdit: dto.managerCanEdit,
      managerCanDelete: dto.managerCanDelete,
    });
    return {
      success: true,
      data: next,
      message: 'Lead permissions updated successfully',
    };
  }
}
