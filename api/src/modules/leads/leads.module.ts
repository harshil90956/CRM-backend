import { Module } from '@nestjs/common';
import { AdminLeadsController } from './admin-leads.controller';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { PrismaModule } from '../../core/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LeadsController, AdminLeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
