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

  private isIsoDate(value: unknown): value is string {
    if (typeof value !== 'string' || !value.trim()) return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime());
  }

  @Post()
  create(@Body() body: CreateBookingDto) {
    if (!this.isUuid(body?.unitId)) {
      return { success: false, message: 'Invalid unitId' };
    }

    if (!this.isUuid(body?.customerId)) {
      return { success: false, message: 'Invalid customerId' };
    }

    if (!this.isUuid(body?.projectId)) {
      return { success: false, message: 'Invalid projectId' };
    }

    if (typeof body?.tenantId !== 'string' || !body.tenantId.trim()) {
      return { success: false, message: 'Invalid tenantId' };
    }

    if (typeof body?.totalPrice !== 'number' || Number.isNaN(body.totalPrice) || !Number.isFinite(body.totalPrice) || body.totalPrice <= 0) {
      return { success: false, message: 'Invalid totalPrice' };
    }

    if (typeof body?.tokenAmount !== 'number' || Number.isNaN(body.tokenAmount) || !Number.isFinite(body.tokenAmount) || body.tokenAmount <= 0) {
      return { success: false, message: 'Invalid tokenAmount' };
    }

    if (typeof body?.customerName !== 'string' || !body.customerName.trim()) {
      return { success: false, message: 'Invalid customerName' };
    }

    if (typeof body?.customerEmail !== 'string' || !body.customerEmail.trim()) {
      return { success: false, message: 'Invalid customerEmail' };
    }

    if (typeof body?.customerPhone !== 'string' || !body.customerPhone.trim()) {
      return { success: false, message: 'Invalid customerPhone' };
    }

    if (body?.agentId && !this.isUuid(body.agentId)) {
      return { success: false, message: 'Invalid agentId' };
    }

    if (body?.managerId && !this.isUuid(body.managerId)) {
      return { success: false, message: 'Invalid managerId' };
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

    if (
      body?.status !== 'HOLD_REQUESTED' &&
      body?.status !== 'HOLD_CONFIRMED' &&
      body?.status !== 'BOOKING_PENDING_APPROVAL' &&
      body?.status !== 'BOOKING_CONFIRMED' &&
      body?.status !== 'PAYMENT_PENDING' &&
      body?.status !== 'BOOKED' &&
      body?.status !== 'CANCELLED' &&
      body?.status !== 'REFUNDED'
    ) {
      return { success: false, message: 'Invalid status' };
    }

    if (body?.approvedAt && !this.isIsoDate(body.approvedAt)) {
      return { success: false, message: 'Invalid approvedAt' };
    }

    if (body?.rejectedAt && !this.isIsoDate(body.rejectedAt)) {
      return { success: false, message: 'Invalid rejectedAt' };
    }

    if (body?.cancelledAt && !this.isIsoDate(body.cancelledAt)) {
      return { success: false, message: 'Invalid cancelledAt' };
    }

    if (body?.managerNotes && (typeof body.managerNotes !== 'string' || !body.managerNotes.trim())) {
      return { success: false, message: 'Invalid managerNotes' };
    }

    if (body?.cancellationReason && (typeof body.cancellationReason !== 'string' || !body.cancellationReason.trim())) {
      return { success: false, message: 'Invalid cancellationReason' };
    }

    if (body?.status === 'CANCELLED' && !body?.cancellationReason?.trim()) {
      return { success: false, message: 'cancellationReason is required when cancelling' };
    }

    return this.bookingsService.updateStatus(id, body);
  }
}
