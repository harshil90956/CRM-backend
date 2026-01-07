// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Module } from '@nestjs/common';

import { CoreModule } from '../../core/core.module';

import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [CoreModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
