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
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('super-admin/users')
export class SuperAdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  private getPayload(req: Request): JwtPayload {
    const payload = req.user as JwtPayload | undefined;
    if (!payload?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    if (payload.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Forbidden');
    }
    return payload;
  }

  @Get()
  async list(@Req() req: Request) {
    this.getPayload(req);
    return this.usersService.listSuperAdminUsers();
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: AdminCreateUserDto) {
    this.getPayload(req);
    return this.usersService.createSuperAdminUser(dto);
  }

  @Patch(':id/status')
  async updateStatus(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    this.getPayload(req);
    return this.usersService.updateSuperAdminUserStatus(id, Boolean(dto.isActive));
  }

  @Get(':id/activity')
  async activity(@Req() req: Request, @Param('id') id: string) {
    this.getPayload(req);
    return this.usersService.getSuperAdminUserActivity(id);
  }
}
