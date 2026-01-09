// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
