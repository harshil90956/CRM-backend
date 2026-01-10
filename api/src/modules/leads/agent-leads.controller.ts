import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { AgentCreateLeadDto, AgentLogLeadActivityDto, AgentUpdateLeadDto, AgentUpdateLeadStatusDto } from './agent-leads.dto.js';
import { AgentLeadsService } from './agent-leads.service.js';

@UseGuards(JwtAuthGuard)
@Controller('agent/leads')
export class AgentLeadsController {
  constructor(private readonly agentLeadsService: AgentLeadsService) {}

  private getPayload(req: Request): JwtPayload {
    const payload = req.user as JwtPayload | undefined;
    if (!payload?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    if (payload.role !== 'AGENT') {
      throw new ForbiddenException('Forbidden');
    }
    return payload;
  }

  @Get()
  async list(@Req() req: Request) {
    const payload = this.getPayload(req);
    return this.agentLeadsService.list(payload.userId, payload.tenantId);
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: AgentCreateLeadDto) {
    const payload = this.getPayload(req);
    return this.agentLeadsService.create(payload.userId, payload.tenantId, dto);
  }

  @Patch(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: AgentUpdateLeadDto) {
    const payload = this.getPayload(req);
    return this.agentLeadsService.update(payload.userId, payload.tenantId, id, dto);
  }

  @Patch(':id/status')
  async updateStatus(@Req() req: Request, @Param('id') id: string, @Body() dto: AgentUpdateLeadStatusDto) {
    const payload = this.getPayload(req);
    return this.agentLeadsService.updateStatus(payload.userId, payload.tenantId, id, dto);
  }

  @Post(':id/activity')
  async logActivity(@Req() req: Request, @Param('id') id: string, @Body() dto: AgentLogLeadActivityDto) {
    const payload = this.getPayload(req);
    return this.agentLeadsService.logActivity(payload.userId, payload.tenantId, id, dto);
  }

  @Get('allowed-actions/:id')
  async allowedActions(@Req() req: Request, @Param('id') id: string) {
    const payload = this.getPayload(req);
    return this.agentLeadsService.allowedActions(payload.userId, payload.tenantId, id);
  }
}
