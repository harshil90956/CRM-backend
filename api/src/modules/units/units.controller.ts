// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { UnitsService } from './units.service';

@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  findAll() {
    return this.unitsService.findAll();
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.unitsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.unitsService.update(id, body);
  }
}
