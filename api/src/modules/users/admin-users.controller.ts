import {
  Body,
  Controller,
  Delete,
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
import { AuthRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  private getPayload(req: Request): JwtPayload {
    const payload = req.user as JwtPayload | undefined;
    if (!payload?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    if (payload.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden');
    }
    return payload;
  }

  @Get()
  async list(@Req() req: Request) {
    const payload = this.getPayload(req);
    return this.usersService.listAdminUsers(payload.tenantId);
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: AdminCreateUserDto) {
    const payload = this.getPayload(req);
    return this.usersService.createAdminUser(payload.tenantId, dto);
  }

  @Patch(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    const payload = this.getPayload(req);
    return this.usersService.updateAdminUser(payload.tenantId, id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const payload = this.getPayload(req);
    return this.usersService.deleteAdminUser(payload.tenantId, id);
  }

  @Patch(':id/status')
  async updateStatus(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    const payload = this.getPayload(req);
    return this.usersService.updateAdminUserStatus(payload.tenantId, id, Boolean(dto.isActive));
  }

  @Patch(':id/role')
  async updateRole(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    const payload = this.getPayload(req);
    return this.usersService.updateAdminUserRole(payload.tenantId, id, dto.role as AuthRole);
  }
}
