// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma/prisma.service';

type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

type ApiError = {
  success: false;
  message: string;
};

export type CreatePaymentDto = {
  bookingId: string;
  amount: number;
};

@Injectable()
export class PaymentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreatePaymentDto): Promise<ApiSuccess<unknown> | ApiError> {
    if (typeof dto?.amount !== 'number' || Number.isNaN(dto.amount) || !Number.isFinite(dto.amount) || dto.amount <= 0) {
      return {
        success: false,
        message: 'Invalid amount',
      };
    }

    const booking = await this.prismaService.client.booking.findUnique({
      where: { id: dto.bookingId },
      select: { id: true, status: true },
    });

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
      };
    }

    if (booking.status === ('CANCELLED' as any) || booking.status === ('EXPIRED' as any)) {
      return {
        success: false,
        message: 'Cannot create payment for cancelled/expired booking',
      };
    }

    const existing = await this.prismaService.client.payment.findFirst({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'desc' as any },
    });

    if (existing) {
      if (existing.status === ('PAID' as any)) {
        return {
          success: false,
          message: 'Conflict: booking already has a paid payment',
        };
      }

      if (existing.status === ('PENDING' as any)) {
        if (existing.amount === dto.amount) {
          return {
            success: true,
            data: existing,
            message: 'Payment already pending for this booking',
          };
        }

        return {
          success: false,
          message: 'Conflict: payment already pending for this booking',
        };
      }
    }

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
