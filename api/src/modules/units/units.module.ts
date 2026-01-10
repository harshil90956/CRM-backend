// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Module } from '@nestjs/common';

import { CoreModule } from '../../core/core.module';

import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';

@Module({
  imports: [CoreModule],
  controllers: [UnitsController],
  providers: [UnitsService],
})
export class UnitsModule {}
