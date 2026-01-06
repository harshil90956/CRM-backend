// TODO: Implemented in later phase by assigned developer

import { Module } from '@nestjs/common';
 
import { PrismaModule } from './database/prisma/prisma.module';
 
@Module({
  imports: [PrismaModule],
  exports: [PrismaModule],
})
export class CoreModule {}
