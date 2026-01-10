import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ManagerAssignTargetDto } from './dto/manager-assign-target.dto';
import { ManagerCreateAgentDto } from './dto/manager-create-agent.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('manager/team')
export class ManagerTeamController {
  constructor(private readonly usersService: UsersService) {}

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
    return this.usersService.listManagerTeam(payload.userId, payload.tenantId);
  }

  @Post()
  async createAgent(@Req() req: Request, @Body() dto: ManagerCreateAgentDto) {
    const payload = this.getPayload(req);
    return this.usersService.createManagerAgent(payload.userId, payload.tenantId, dto);
  }

  @Patch(':userId/status')
  async updateStatus(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const payload = this.getPayload(req);
    return this.usersService.updateManagerTeamStatus(payload.userId, payload.tenantId, userId, Boolean(dto.isActive));
  }

  @Patch(':userId/assign-target')
  async assignTarget(@Req() req: Request, @Param('userId') userId: string, @Body() dto: ManagerAssignTargetDto) {
    this.getPayload(req);
    return this.usersService.assignManagerTarget();
  }
}
