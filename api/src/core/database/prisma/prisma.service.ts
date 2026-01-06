/**
  * CORE INFRA FILE
  * Owned by Dev A (Platform)
  * Domain developers MUST NOT modify this file
  */
 
 import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
 import { PrismaClient } from '@prisma/client';
 
 import { EnvService } from '../../../config/env/env.service';
 
 @Injectable()
 export class PrismaService implements OnModuleInit, OnModuleDestroy {
   private prisma: PrismaClient | null = null;
 
   constructor(private readonly envService: EnvService) {}
 
   get client(): PrismaClient {
     if (!this.prisma) {
       throw new Error('PrismaService has not been initialized. Ensure PrismaModule is imported and the app is bootstrapped.');
     }
     return this.prisma;
   }
 
   async onModuleInit(): Promise<void> {
     this.envService.getDatabaseUrl();

     this.prisma = new PrismaClient();

     await this.prisma.$connect();
   }
 
   async onModuleDestroy(): Promise<void> {
     if (this.prisma) {
       await this.prisma.$disconnect();
       this.prisma = null;
     }
   }
 }
