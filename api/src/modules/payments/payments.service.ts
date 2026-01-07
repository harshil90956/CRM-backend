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
  bookingId?: string;
  customerId: string;
  unitId: string;
  amount: number;
  method: string;
  tenantId: string;
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

    const booking = dto.bookingId ? await this.prismaService.client.booking.findUnique({
      where: { id: dto.bookingId },
      select: { id: true, status: true },
    }) : null;

    if (dto.bookingId && !booking) {
      return {
        success: false,
        message: 'Booking not found',
      };
    }

    if (booking && (booking.status === ('CANCELLED' as any) || booking.status === ('REFUNDED' as any))) {
      return {
        success: false,
        message: 'Cannot create payment for cancelled/expired booking',
      };
    }

    const existing = booking ? await this.prismaService.client.payment.findFirst({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'desc' as any },
    }) : null;

    if (existing) {
      if (existing.status === ('Received' as any)) {
        return {
          success: false,
          message: 'Conflict: booking already has a paid payment',
        };
      }

      if (existing.status === ('Pending' as any)) {
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
        customerId: dto.customerId,
        unitId: dto.unitId,
        amount: dto.amount,
        method: dto.method as any,
        status: 'PENDING' as any,
        tenantId: dto.tenantId,
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
