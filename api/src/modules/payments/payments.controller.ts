// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Body, Controller, Get, Post } from '@nestjs/common';

import { CreatePaymentDto, PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private isUuid(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
  }

  @Post()
  create(@Body() body: CreatePaymentDto) {
    if (!this.isUuid(body?.bookingId)) {
      return { success: false, message: 'Invalid bookingId' };
    }

    if (typeof body?.amount !== 'number' || Number.isNaN(body.amount) || body.amount <= 0) {
      return { success: false, message: 'Invalid amount' };
    }

    return this.paymentsService.create(body);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }
}
