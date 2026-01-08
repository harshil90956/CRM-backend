// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma/prisma.service';

import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

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
export class BookingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateBookingDto): Promise<ApiSuccess<unknown> | ApiError> {
    const booking = await (this.prismaService.client.booking as any).create({
      data: {
        unitId: dto.unitId,
        customerId: dto.customerId,
        agentId: dto.agentId,
        managerId: dto.managerId,
        projectId: dto.projectId,
        totalPrice: dto.totalPrice,
        tokenAmount: dto.tokenAmount,
        status: 'HOLD_REQUESTED',
        tenantId: dto.tenantId,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        notes: dto.notes,
      },
    });

    return {
      success: true,
      data: booking,
      message: 'Booking created successfully',
    };
  }

  async findById(id: string): Promise<ApiSuccess<unknown> | ApiError> {
    const booking = await (this.prismaService.client.booking as any).findUnique({
      where: { id },
      include: {
        unit: { select: { unitNo: true, project: { select: { name: true } } } },
        customer: { select: { name: true, email: true, phone: true } },
        agent: { select: { name: true } },
        manager: { select: { name: true } },
      },
    });

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
      };
    }

    return {
      success: true,
      data: {
        ...booking,
        unitNo: booking?.unit?.unitNo,
        projectName: booking?.unit?.project?.name,
        customerName: booking?.customerName ?? booking?.customer?.name,
        customerEmail: booking?.customerEmail ?? booking?.customer?.email,
        customerPhone: booking?.customerPhone ?? booking?.customer?.phone,
        agentName: booking?.agent?.name,
        managerName: booking?.manager?.name,
      },
      message: 'Booking fetched successfully',
    };
  }

  async findAll(): Promise<ApiSuccess<unknown[]>> {
    const bookings = await (this.prismaService.client.booking as any).findMany({
      include: {
        unit: { select: { unitNo: true, project: { select: { name: true } } } },
        customer: { select: { name: true, email: true, phone: true } },
        agent: { select: { name: true } },
        manager: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: bookings.map((b: any) => ({
        ...b,
        unitNo: b?.unit?.unitNo,
        projectName: b?.unit?.project?.name,
        customerName: b?.customerName ?? b?.customer?.name,
        customerEmail: b?.customerEmail ?? b?.customer?.email,
        customerPhone: b?.customerPhone ?? b?.customer?.phone,
        agentName: b?.agent?.name,
        managerName: b?.manager?.name,
      })),
      message: 'Bookings fetched successfully',
    };
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<ApiSuccess<unknown> | ApiError> {
    const existing = await this.prismaService.client.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: 'Booking not found',
      };
    }

    const data: Record<string, unknown> = {
      status: dto.status as any,
    };

    if (dto.approvedAt) data.approvedAt = new Date(dto.approvedAt);
    if (dto.rejectedAt) data.rejectedAt = new Date(dto.rejectedAt);
    if (dto.cancelledAt) data.cancelledAt = new Date(dto.cancelledAt);
    if (typeof dto.cancellationReason === 'string') data.cancellationReason = dto.cancellationReason;
    if (typeof dto.managerNotes === 'string') data.managerNotes = dto.managerNotes;

    const updated = await (this.prismaService.client.booking as any).update({
      where: { id },
      data,
    });

    return {
      success: true,
      data: updated,
      message: 'Booking status updated successfully',
    };
  }
}
