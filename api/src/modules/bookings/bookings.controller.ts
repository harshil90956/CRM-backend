// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  private isUuid(value: unknown): value is string {
    return typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  @Post()
  create(@Body() body: CreateBookingDto) {
    if (!this.isUuid(body?.unitId)) {
      return { success: false, message: 'Invalid unitId' };
    }

    if (!this.isUuid(body?.customerId)) {
      return { success: false, message: 'Invalid customerId' };
    }

    return this.bookingsService.create(body);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateBookingStatusDto) {
    if (!this.isUuid(id)) {
      return { success: false, message: 'Invalid booking id' };
    }

    if (body?.status !== 'HOLD' && body?.status !== 'BOOKED' && body?.status !== 'CANCELLED') {
      return { success: false, message: 'Invalid status' };
    }

    return this.bookingsService.updateStatus(id, body);
  }
}
