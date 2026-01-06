// TODO: Implemented in later phase by assigned developer

import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getStatus(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
