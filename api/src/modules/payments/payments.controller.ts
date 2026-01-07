// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Body, Controller, Get, Post } from '@nestjs/common';

import { CreatePaymentDto, PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() body: CreatePaymentDto) {
    return this.paymentsService.create(body);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }
}
