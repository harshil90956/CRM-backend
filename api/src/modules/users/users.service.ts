import {
  BadRequestException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { AuthRole } from '@prisma/client';

import { PrismaService } from '../../core/database/prisma/prisma.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ManagerCreateAgentDto } from './dto/manager-create-agent.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async listAdminUsers(tenantId: string) {
    const users = await this.prisma.client.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        managerId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: users, message: 'Users retrieved successfully' };
  }

  async createAdminUser(tenantId: string, dto: AdminCreateUserDto) {
    if (!dto?.name) throw new BadRequestException('name is required');
    if (!dto?.email) throw new BadRequestException('email is required');
    if (!dto?.role) throw new BadRequestException('role is required');

    const email = this.normalizeEmail(dto.email);

    if (dto.tenantId && dto.tenantId !== tenantId) {
      throw new BadRequestException('ADMIN cannot create users in a different tenant');
    }

    const allowedRoles: AuthRole[] = [AuthRole.MANAGER, AuthRole.AGENT];
    if (!allowedRoles.includes(dto.role)) {
      throw new BadRequestException(`ADMIN can only create: ${allowedRoles.join(', ')}`);
    }

    if (dto.role === AuthRole.MANAGER && dto.managerId) {
      throw new BadRequestException('managerId is not allowed when creating a MANAGER');
    }

    const existing = await this.prisma.client.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw new BadRequestException('email already exists');
    }

    const user = await this.prisma.client.user.create({
      data: {
        name: dto.name,
        email,
        phone: dto.phone,
        role: dto.role,
        tenantId,
        managerId: dto.managerId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        managerId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: user, message: 'User created successfully' };
  }

  async updateAdminUser(tenantId: string, id: string, dto: AdminUpdateUserDto) {
    const existing = await this.prisma.client.user.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('User not found');

    if (dto.email) {
      const email = this.normalizeEmail(dto.email);
      const other = await this.prisma.client.user.findUnique({ where: { email }, select: { id: true } });
      if (other && other.id !== id) {
        throw new BadRequestException('email already exists');
      }
    }

    if (dto.managerId) {
      const manager = await this.prisma.client.user.findUnique({ where: { id: dto.managerId }, select: { id: true } });
      if (!manager) {
        throw new BadRequestException('managerId does not exist');
      }
    }

    const user = await this.prisma.client.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email ? this.normalizeEmail(dto.email) : undefined,
        phone: dto.phone,
        managerId: dto.managerId === null ? null : dto.managerId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        managerId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: user, message: 'User updated successfully' };
  }

  async deleteAdminUser(tenantId: string, id: string) {
    const existing = await this.prisma.client.user.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('User not found');

    await this.prisma.client.user.delete({ where: { id } });
    return { success: true, message: 'User deleted successfully' };
  }

  async updateAdminUserStatus(tenantId: string, id: string, isActive: boolean) {
    const existing = await this.prisma.client.user.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('User not found');

    const user = await this.prisma.client.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        managerId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: user, message: 'User status updated successfully' };
  }

  async updateAdminUserRole(tenantId: string, id: string, role: AuthRole) {
    const existing = await this.prisma.client.user.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('User not found');

    const allowedRoles: AuthRole[] = [AuthRole.MANAGER, AuthRole.AGENT];
    if (!allowedRoles.includes(role)) {
      throw new BadRequestException(`ADMIN can only set role to: ${allowedRoles.join(', ')}`);
    }

    const user = await this.prisma.client.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        managerId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: user, message: 'User role updated successfully' };
  }

  async listManagerTeam(managerId: string, tenantId: string) {
    const users = await this.prisma.client.user.findMany({
      where: { managerId, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        managerId: true,
        projectId: true,
        project: { select: { id: true, name: true } },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: users, message: 'Team retrieved successfully' };
  }

  async createManagerAgent(managerId: string, tenantId: string, dto: ManagerCreateAgentDto) {
    if (!dto?.name) throw new BadRequestException('name is required');
    if (!dto?.email) throw new BadRequestException('email is required');

    const email = this.normalizeEmail(dto.email);

    const existing = await this.prisma.client.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw new BadRequestException('email already exists');
    }

    if (dto.projectId) {
      const project = await this.prisma.client.project.findFirst({
        where: { id: dto.projectId, tenantId },
        select: { id: true },
      });
      if (!project) {
        throw new BadRequestException('projectId is invalid');
      }
    }

    const user = await this.prisma.client.user.create({
      data: {
        name: dto.name,
        email,
        phone: dto.phone,
        role: AuthRole.AGENT,
        tenantId,
        managerId,
        projectId: dto.projectId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        managerId: true,
        projectId: true,
        project: { select: { id: true, name: true } },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: user, message: 'Agent created successfully' };
  }

  async updateManagerTeamStatus(managerId: string, tenantId: string, userId: string, isActive: boolean) {
    const existing = await this.prisma.client.user.findFirst({
      where: { id: userId, managerId, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('User not found');

    const user = await this.prisma.client.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        managerId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: user, message: 'Team member status updated successfully' };
  }

  async assignManagerTarget() {
    throw new NotImplementedException('Targets are not supported by the current database schema');
  }

  async listSuperAdminUsers() {
    const users = await this.prisma.client.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        managerId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: users, message: 'Users retrieved successfully' };
  }

  async createSuperAdminUser(dto: AdminCreateUserDto) {
    if (!dto?.name) throw new BadRequestException('name is required');
    if (!dto?.email) throw new BadRequestException('email is required');
    if (!dto?.role) throw new BadRequestException('role is required');
    if (!dto?.tenantId) throw new BadRequestException('tenantId is required');

    const email = this.normalizeEmail(dto.email);

    const allowedRoles: AuthRole[] = [AuthRole.ADMIN];
    if (!allowedRoles.includes(dto.role)) {
      throw new BadRequestException(`SUPER_ADMIN can only create: ${allowedRoles.join(', ')}`);
    }

    if (dto.managerId) {
      throw new BadRequestException('managerId is not allowed when creating an ADMIN');
    }

    const existing = await this.prisma.client.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw new BadRequestException('email already exists');
    }

    if (dto.managerId) {
      const manager = await this.prisma.client.user.findUnique({ where: { id: dto.managerId }, select: { id: true } });
      if (!manager) {
        throw new BadRequestException('managerId does not exist');
      }
    }

    const user = await this.prisma.client.user.create({
      data: {
        name: dto.name,
        email,
        phone: dto.phone,
        role: dto.role,
        tenantId: dto.tenantId,
        managerId: dto.managerId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        managerId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: user, message: 'User created successfully' };
  }

  async updateSuperAdminUserStatus(id: string, isActive: boolean) {
    const existing = await this.prisma.client.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('User not found');

    const user = await this.prisma.client.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        managerId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: user, message: 'User status updated successfully' };
  }

  async getSuperAdminUserActivity(id: string) {
    const existing = await this.prisma.client.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('User not found');

    const activities = await this.prisma.client.activity.findMany({
      where: { createdBy: id },
      select: {
        id: true,
        leadId: true,
        type: true,
        message: true,
        tenantId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: activities, message: 'User activity retrieved successfully' };
  }
}
