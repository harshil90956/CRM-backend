import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { AdminUsersController } from './admin-users.controller';
import { ManagerTeamController } from './manager-team.controller';
import { SuperAdminUsersController } from './super-admin-users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminUsersController, ManagerTeamController, SuperAdminUsersController],
  providers: [UsersService],
})
export class UsersModule {}
