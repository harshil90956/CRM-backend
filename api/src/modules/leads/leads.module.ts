import { Module } from '@nestjs/common';
import { AdminLeadsController } from './admin-leads.controller';
import { AgentLeadsController } from './agent-leads.controller';
import { LeadsController } from './leads.controller';
import { LeadPermissionsController } from './lead-permissions.controller';
import { ManagerLeadsController } from './manager-leads.controller';
import { AgentLeadsService } from './agent-leads.service';
import { LeadPermissionsService } from './lead-permissions.service';
import { LeadsService } from './leads.service';
import { PrismaModule } from '../../core/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LeadsController, AdminLeadsController, ManagerLeadsController, AgentLeadsController, LeadPermissionsController],
  providers: [LeadsService, AgentLeadsService, LeadPermissionsService],
})
export class LeadsModule {}
