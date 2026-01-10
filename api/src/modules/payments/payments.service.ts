// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma/prisma.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { MarkReceivedDto } from './dto/mark-received.dto';
import { CancelPaymentDto } from './dto/cancel-payment.dto';

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

  private isAllowedTransition(from: string, to: string): boolean {
    const allowed: Record<string, string[]> = {
      Pending: ['Received', 'Overdue', 'Refunded'],
      Overdue: ['Received', 'Refunded'],
      Received: ['Refunded'],
      Refunded: [],
    };

    const list = allowed[String(from)] ?? [];
    return list.includes(String(to));
  }

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
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
        notes: dto.notes,
        paymentType: dto.paymentType,
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
        paidAt: p.paidAt ?? null,
        paymentType: p.paymentType ?? null,
        unitNo: p?.unit?.unitNo,
        customerName: p?.customer?.name,
      })),
      message: 'Payments fetched successfully',
    };
  }

  async findById(id: string): Promise<ApiSuccess<unknown> | ApiError> {
    const payment = await (this.prismaService.client.payment as any).findUnique({
      where: { id },
      include: {
        unit: { select: { unitNo: true } },
        customer: { select: { name: true } },
      },
    });

    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    return {
      success: true,
      data: {
        ...payment,
        paidAt: payment.paidAt ?? null,
        paymentType: payment.paymentType ?? null,
        unitNo: payment?.unit?.unitNo,
        customerName: payment?.customer?.name,
      },
      message: 'Payment fetched successfully',
    };
  }

  async update(id: string, dto: UpdatePaymentDto): Promise<ApiSuccess<unknown> | ApiError> {
    const existing = await this.prismaService.client.payment.findUnique({ where: { id } });
    if (!existing) return { success: false, message: 'Payment not found' };

    if (dto.status && !this.isAllowedTransition(existing.status, dto.status)) {
      return { success: false, message: 'Invalid status transition' };
    }

    const data: Record<string, unknown> = {};
    if (dto.status) data.status = dto.status as any;
    if (dto.method) data.method = dto.method as any;
    if (typeof dto.amount === 'number') data.amount = dto.amount;

    if (dto.paidAt === null) data.paidAt = null;
    if (typeof dto.paidAt === 'string') data.paidAt = new Date(dto.paidAt);

    if (dto.paymentType === null) data.paymentType = null;
    if (typeof dto.paymentType === 'string') data.paymentType = dto.paymentType;

    if (dto.receiptNo === null) data.receiptNo = null;
    if (typeof dto.receiptNo === 'string') data.receiptNo = dto.receiptNo;

    if (dto.notes === null) data.notes = null;
    if (typeof dto.notes === 'string') data.notes = dto.notes;

    if (dto.refundRefId === null) data.refundRefId = null;
    if (typeof dto.refundRefId === 'string') data.refundRefId = dto.refundRefId;

    const updated = await (this.prismaService.client.payment as any).update({
      where: { id },
      data,
    });

    return {
      success: true,
      data: updated,
      message: 'Payment updated successfully',
    };
  }

  async markReceived(id: string, dto: MarkReceivedDto): Promise<ApiSuccess<unknown> | ApiError> {
    const existing = await this.prismaService.client.payment.findUnique({ where: { id } });
    if (!existing) return { success: false, message: 'Payment not found' };

    if (!this.isAllowedTransition(existing.status, dto.status)) {
      return { success: false, message: 'Invalid status transition' };
    }

    const updated = await (this.prismaService.client.payment as any).update({
      where: { id },
      data: {
        status: dto.status as any,
        paidAt: new Date(dto.paidAt),
        receiptNo: typeof dto.receiptNo === 'string' ? dto.receiptNo : undefined,
      },
    });

    return { success: true, data: updated, message: 'Payment marked as received' };
  }

  async cancel(id: string, dto: CancelPaymentDto): Promise<ApiSuccess<unknown> | ApiError> {
    const existing = await this.prismaService.client.payment.findUnique({ where: { id } });
    if (!existing) return { success: false, message: 'Payment not found' };

    if (!this.isAllowedTransition(existing.status, dto.status)) {
      return { success: false, message: 'Invalid status transition' };
    }

    const data: Record<string, unknown> = {
      status: dto.status as any,
    };

    if (dto.refundRefId === null) data.refundRefId = null;
    if (typeof dto.refundRefId === 'string') data.refundRefId = dto.refundRefId;

    if (dto.notes === null) data.notes = null;
    if (typeof dto.notes === 'string') data.notes = dto.notes;

    if (dto.paidAt === null) data.paidAt = null;
    if (typeof dto.paidAt === 'string') data.paidAt = new Date(dto.paidAt);

    const updated = await (this.prismaService.client.payment as any).update({
      where: { id },
      data,
    });

    return { success: true, data: updated, message: 'Payment cancelled successfully' };
  }

  async summary(): Promise<ApiSuccess<unknown>> {
    const payments = await this.prismaService.client.payment.findMany({
      select: { amount: true, status: true },
    });

    const base = {
      totalReceivedAmount: 0,
      totalPendingAmount: 0,
      totalOverdueAmount: 0,
      totalRefundedAmount: 0,
      countReceived: 0,
      countPending: 0,
      countOverdue: 0,
      countRefunded: 0,
    };

    for (const p of payments) {
      if (p.status === 'Received') {
        base.totalReceivedAmount += p.amount;
        base.countReceived += 1;
        continue;
      }
      if (p.status === 'Pending') {
        base.totalPendingAmount += p.amount;
        base.countPending += 1;
        continue;
      }
      if (p.status === 'Overdue') {
        base.totalOverdueAmount += p.amount;
        base.countOverdue += 1;
        continue;
      }
      if (p.status === 'Refunded') {
        base.totalRefundedAmount += p.amount;
        base.countRefunded += 1;
      }
    }

    return {
      success: true,
      data: base,
      message: 'Payments summary fetched successfully',
    };
  }
}
