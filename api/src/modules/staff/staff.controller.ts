// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Controller, Get, Query } from '@nestjs/common';

import { StaffService } from './staff.service';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll(@Query('role') role?: string) {
    return this.staffService.findAll({ role });
  }
}
