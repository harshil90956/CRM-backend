// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma/prisma.service';

type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

export type CreatePaymentDto = {
  bookingId: string;
  amount: number;
};

@Injectable()
export class PaymentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreatePaymentDto): Promise<ApiSuccess<unknown>> {
    const payment = await this.prismaService.client.payment.create({
      data: {
        bookingId: dto.bookingId,
        amount: dto.amount,
        status: 'PENDING' as any,
      },
    });

    return {
      success: true,
      data: payment,
      message: 'Payment created successfully',
    };
  }

  async findAll(): Promise<ApiSuccess<unknown[]>> {
    const payments = await this.prismaService.client.payment.findMany();

    return {
      success: true,
      data: payments,
      message: 'Payments fetched successfully',
    };
  }
}
