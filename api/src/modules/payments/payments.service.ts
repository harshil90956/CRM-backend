// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma/prisma.service';

import { CreatePaymentDto } from './dto/create-payment.dto';

type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

type ApiError = {
  success: false;
  message: string;
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
      select: { id: true },
    });

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
      };
    }

    const payment = await this.prismaService.client.payment.create({
      data: {
        bookingId: dto.bookingId,
        customerId: dto.customerId,
        unitId: dto.unitId,
        tenantId: dto.tenantId,
        amount: dto.amount,
        status: dto.status as any,
        method: dto.method as any,
        paidAt: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        notes: dto.notes,
        paymentType: dto.type,
        receiptNo: dto.receiptNo,
        refundRefId: dto.refundRefId,
      },
    });

    return {
      success: true,
      data: payment,
      message: 'Payment created successfully',
    };
  }

  async findAll(): Promise<ApiSuccess<unknown[]>> {
    const payments = await (this.prismaService.client.payment as any).findMany({
      include: {
        unit: { select: { unitNo: true } },
        customer: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: payments.map((p: any) => ({
        ...p,
        updatedAt: p.updatedAt ?? p.createdAt,
        paymentDate: p.paidAt ?? null,
        type: p.paymentType ?? null,
        unitNo: p?.unit?.unitNo,
        customerName: p?.customer?.name,
      })),
      message: 'Payments fetched successfully',
    };
  }
}
