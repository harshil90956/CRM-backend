/**
  * CORE INFRA FILE
  * Owned by Dev A (Platform)
  * Domain developers MUST NOT modify this file
  */
 
 import { Injectable } from '@nestjs/common';
 
 import { validateEnvVars } from './env.schema';
 import type { EnvVars } from './env.types';
 
 @Injectable()
 export class EnvService {
   private readonly env: EnvVars;
 
   constructor() {
     // This is the ONLY place where process.env is allowed to be read.
     this.env = validateEnvVars({
       DATABASE_URL: process.env.DATABASE_URL,
     });
   }
 
   getDatabaseUrl(): string {
     return this.env.DATABASE_URL;
   }
 }
