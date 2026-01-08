// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Body, Controller, Get, Post } from '@nestjs/common';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private isUuid(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
  }

  private isIsoDate(value: unknown): value is string {
    if (typeof value !== 'string' || !value.trim()) return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime());
  }

  @Post()
  create(@Body() body: CreatePaymentDto) {
    if (!this.isUuid(body?.bookingId)) {
      return { success: false, message: 'Invalid bookingId' };
    }

    if (!this.isUuid(body?.customerId)) {
      return { success: false, message: 'Invalid customerId' };
    }

    if (!this.isUuid(body?.unitId)) {
      return { success: false, message: 'Invalid unitId' };
    }

    if (typeof body?.tenantId !== 'string' || !body.tenantId.trim()) {
      return { success: false, message: 'Invalid tenantId' };
    }

    if (typeof body?.amount !== 'number' || Number.isNaN(body.amount) || body.amount <= 0) {
      return { success: false, message: 'Invalid amount' };
    }

    if (body?.status !== 'Pending' && body?.status !== 'Received' && body?.status !== 'Overdue' && body?.status !== 'Refunded') {
      return { success: false, message: 'Invalid status' };
    }

    if (
      body?.method !== 'Bank_Transfer' &&
      body?.method !== 'Cash' &&
      body?.method !== 'Cheque' &&
      body?.method !== 'Online' &&
      body?.method !== 'UPI' &&
      body?.method !== 'RTGS' &&
      body?.method !== 'Card' &&
      body?.method !== 'Net_Banking'
    ) {
      return { success: false, message: 'Invalid method' };
    }

    if (body?.paymentDate && !this.isIsoDate(body.paymentDate)) {
      return { success: false, message: 'Invalid paymentDate' };
    }

    return this.paymentsService.create(body);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }
}
