/**
 * CORE INFRA FILE
 * Owned by Dev A (Platform)
 * Domain developers MUST NOT modify this file
 */

import type { Request } from 'express';

import type { Role } from './role.type';

export interface AuthUser {
  id: string;
  role: Role;
}

export interface RequestWithUser extends Request {
  user: AuthUser;
}
