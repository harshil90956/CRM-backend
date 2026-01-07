// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [PrismaModule],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
