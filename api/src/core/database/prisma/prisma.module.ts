/**
  * CORE INFRA FILE
  * Owned by Dev A (Platform)
  * Domain developers MUST NOT modify this file
  */
 
 import { Module } from '@nestjs/common';
 
 import { ConfigModule } from '../../../config/config.module';
 import { PrismaService } from './prisma.service';
 
 @Module({
   imports: [ConfigModule],
   providers: [PrismaService],
   exports: [PrismaService],
 })
 export class PrismaModule {}
