/**
  * CORE INFRA FILE
  * Owned by Dev A (Platform)
  * Domain developers MUST NOT modify this file
  */
 
 import type { EnvVars } from './env.types';
 
 export function validateEnvVars(input: Partial<Record<keyof EnvVars, unknown>>): EnvVars {
   const databaseUrl = input.DATABASE_URL;
 
   if (typeof databaseUrl !== 'string' || databaseUrl.trim().length === 0) {
     throw new Error('Missing required environment variable: DATABASE_URL');
   }
 
   return {
     DATABASE_URL: databaseUrl,
   };
 }
