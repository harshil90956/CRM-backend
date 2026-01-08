// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Controller, Get } from '@nestjs/common';

import { UnitsService } from './units.service';

@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  findAll() {
    return this.unitsService.findAll();
  }
}
