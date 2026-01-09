import { Body, Controller, ForbiddenException, Get, Param, Patch, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { LeadsService } from './leads.service';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { ManagerUpdateLeadStatusDto } from './dto/manager-update-lead-status.dto';

@UseGuards(JwtAuthGuard)
@Controller('manager/leads')
export class ManagerLeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  private getPayload(req: Request): JwtPayload {
    const payload = req.user as JwtPayload | undefined;
    if (!payload?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    if (payload.role !== 'MANAGER') {
      throw new ForbiddenException('Forbidden');
    }
    return payload;
  }

  @Get()
  async list(@Req() req: Request) {
    const payload = this.getPayload(req);
    return this.leadsService.findManagerLeads(payload.userId, payload.tenantId);
  }

  @Patch(':id/status')
  async updateStatus(@Req() req: Request, @Param('id') id: string, @Body() dto: ManagerUpdateLeadStatusDto) {
    const payload = this.getPayload(req);
    return this.leadsService.updateManagerLeadStatus(payload.userId, payload.tenantId, id, dto);
  }

  @Patch(':id/assign')
  async assign(@Req() req: Request, @Param('id') id: string, @Body() dto: AssignLeadDto) {
    const payload = this.getPayload(req);
    return this.leadsService.assignManagerLead(payload.userId, payload.tenantId, id, dto);
  }

  @Get('status')
  async statusList() {
    return this.leadsService.getManagerLeadStatusList();
  }

  @Get('allowed-actions/:id')
  async allowedActions(@Req() req: Request, @Param('id') id: string) {
    const payload = this.getPayload(req);
    return this.leadsService.getManagerAllowedActions(payload.userId, payload.tenantId, id);
  }
}
