// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/database/prisma/prisma.service';

import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CreateHoldBookingDto } from './dto/create-hold-booking.dto';
import { ApproveHoldDto } from './dto/approve-hold.dto';
import { RejectHoldDto } from './dto/reject-hold.dto';
import { ApproveBookingDto } from './dto/approve-booking.dto';
import { RejectBookingDto } from './dto/reject-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

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

  private getUnitStatusForBookingStatus(
    bookingStatus: string,
  ): 'AVAILABLE' | 'HOLD' | 'BOOKED' | null {
    const status = String(bookingStatus);
    if (status === 'HOLD_REQUESTED' || status === 'HOLD_CONFIRMED') return 'HOLD';
    if (
      status === 'BOOKING_PENDING_APPROVAL' ||
      status === 'BOOKING_CONFIRMED' ||
      status === 'PAYMENT_PENDING' ||
      status === 'BOOKED'
    ) {
      return 'BOOKED';
    }
    if (status === 'CANCELLED' || status === 'REFUNDED') return 'AVAILABLE';
    return null;
  }

  private async syncUnitStatusFromBookingStatus(unitId: string, bookingStatus: string) {
    const nextUnitStatus = this.getUnitStatusForBookingStatus(bookingStatus);
    if (!nextUnitStatus) return;

    const unit = await this.prismaService.client.unit.findUnique({
      where: { id: unitId },
      select: { id: true, status: true },
    });

    if (!unit) return;
    if (unit.status === 'SOLD') return;
    if (unit.status === nextUnitStatus) return;

    await (this.prismaService.client.unit as any).update({
      where: { id: unitId },
      data: { status: nextUnitStatus as any },
    });
  }

  private isAllowedTransition(from: string, to: string): boolean {
    const allowed: Record<string, string[]> = {
      HOLD_REQUESTED: ['HOLD_CONFIRMED', 'CANCELLED'],
      HOLD_CONFIRMED: ['BOOKING_PENDING_APPROVAL', 'BOOKING_CONFIRMED', 'BOOKED', 'CANCELLED'],
      BOOKING_PENDING_APPROVAL: ['BOOKING_CONFIRMED', 'CANCELLED', 'REFUNDED'],
      BOOKING_CONFIRMED: ['PAYMENT_PENDING', 'BOOKED', 'CANCELLED', 'REFUNDED'],
      PAYMENT_PENDING: ['BOOKED', 'CANCELLED', 'REFUNDED'],
      BOOKED: ['BOOKING_PENDING_APPROVAL'],
      CANCELLED: [],
      REFUNDED: [],
    };

    const list = allowed[String(from)] ?? [];
    return list.includes(String(to));
  }

  async create(dto: CreateBookingDto): Promise<ApiSuccess<unknown> | ApiError> {
    const booking = await (this.prismaService.client.booking as any).create({
      data: {
        status: dto.status as any,
        unitId: dto.unitId,
        customerId: dto.customerId,
        agentId: dto.agentId,
        managerId: dto.managerId,
        projectId: dto.projectId,
        totalPrice: dto.totalPrice,
        tokenAmount: dto.tokenAmount,
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
        customerName: booking?.customerName,
        customerEmail: booking?.customerEmail,
        customerPhone: booking?.customerPhone,
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
        customerName: b?.customerName,
        customerEmail: b?.customerEmail,
        customerPhone: b?.customerPhone,
        agentName: b?.agent?.name,
        managerName: b?.manager?.name,
      })),
      message: 'Bookings fetched successfully',
    };
  }

  async statuses(): Promise<ApiSuccess<string[]>> {
    return {
      success: true,
      data: [
        'HOLD_REQUESTED',
        'HOLD_CONFIRMED',
        'BOOKING_PENDING_APPROVAL',
        'BOOKING_CONFIRMED',
        'PAYMENT_PENDING',
        'BOOKED',
        'CANCELLED',
        'REFUNDED',
      ],
      message: 'Booking statuses fetched successfully',
    };
  }

  async timeline(id: string): Promise<ApiSuccess<unknown> | ApiError> {
    const booking = await this.prismaService.client.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        holdExpiresAt: true,
        approvedAt: true,
        rejectedAt: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!booking) {
      return { success: false, message: 'Booking not found' };
    }

    const events: Array<{ key: string; at: string }> = [];
    events.push({ key: 'CREATED', at: booking.createdAt.toISOString() });
    if (booking.holdExpiresAt) events.push({ key: 'HOLD_EXPIRES_AT', at: booking.holdExpiresAt.toISOString() });
    if (booking.approvedAt) events.push({ key: 'APPROVED_AT', at: booking.approvedAt.toISOString() });
    if (booking.rejectedAt) events.push({ key: 'REJECTED_AT', at: booking.rejectedAt.toISOString() });
    if (booking.cancelledAt) events.push({ key: 'CANCELLED_AT', at: booking.cancelledAt.toISOString() });
    events.push({ key: 'UPDATED', at: booking.updatedAt.toISOString() });

    return {
      success: true,
      data: { id: booking.id, status: booking.status, events },
      message: 'Booking timeline fetched successfully',
    };
  }

  async hold(dto: CreateHoldBookingDto): Promise<ApiSuccess<unknown> | ApiError> {
    const booking = await (this.prismaService.client.booking as any).create({
      data: {
        status: dto.status as any,
        unitId: dto.unitId,
        customerId: dto.customerId,
        agentId: dto.agentId,
        managerId: dto.managerId,
        projectId: dto.projectId,
        totalPrice: dto.totalPrice,
        tokenAmount: dto.tokenAmount,
        tenantId: dto.tenantId,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        notes: dto.notes,
        holdExpiresAt: dto.holdExpiresAt ? new Date(dto.holdExpiresAt) : undefined,
      },
    });

    await this.syncUnitStatusFromBookingStatus(dto.unitId, dto.status);

    return {
      success: true,
      data: booking,
      message: 'Hold booking created successfully',
    };
  }

  async approveHold(id: string, dto: ApproveHoldDto): Promise<ApiSuccess<unknown> | ApiError> {
    const existing = await this.prismaService.client.booking.findUnique({ where: { id } });
    if (!existing) return { success: false, message: 'Booking not found' };

    if (!this.isAllowedTransition(existing.status, dto.status)) {
      return { success: false, message: 'Invalid status transition' };
    }

    const updated = await (this.prismaService.client.booking as any).update({
      where: { id },
      data: {
        status: dto.status as any,
        approvedAt: new Date(dto.approvedAt),
        managerNotes: dto.managerNotes,
      },
    });

    await this.syncUnitStatusFromBookingStatus(existing.unitId, dto.status);

    return { success: true, data: updated, message: 'Hold approved successfully' };
  }

  async rejectHold(id: string, dto: RejectHoldDto): Promise<ApiSuccess<unknown> | ApiError> {
    const existing = await this.prismaService.client.booking.findUnique({ where: { id } });
    if (!existing) return { success: false, message: 'Booking not found' };

    if (!this.isAllowedTransition(existing.status, dto.status)) {
      return { success: false, message: 'Invalid status transition' };
    }

    const updated = await (this.prismaService.client.booking as any).update({
      where: { id },
      data: {
        status: dto.status as any,
        cancelledAt: new Date(dto.cancelledAt),
        cancellationReason: dto.cancellationReason,
        managerNotes: dto.managerNotes,
      },
    });

    await this.syncUnitStatusFromBookingStatus(existing.unitId, dto.status);

    return { success: true, data: updated, message: 'Hold rejected successfully' };
  }

  async approveBooking(id: string, dto: ApproveBookingDto): Promise<ApiSuccess<unknown> | ApiError> {
    const existing = await this.prismaService.client.booking.findUnique({ where: { id } });
    if (!existing) return { success: false, message: 'Booking not found' };

    if (!this.isAllowedTransition(existing.status, dto.status)) {
      return { success: false, message: 'Invalid status transition' };
    }

    const updated = await (this.prismaService.client.booking as any).update({
      where: { id },
      data: {
        status: dto.status as any,
        approvedAt: new Date(dto.approvedAt),
        managerNotes: dto.managerNotes,
      },
    });

    await this.syncUnitStatusFromBookingStatus(existing.unitId, dto.status);

    return { success: true, data: updated, message: 'Booking approved successfully' };
  }

  async rejectBooking(id: string, dto: RejectBookingDto): Promise<ApiSuccess<unknown> | ApiError> {
    const existing = await this.prismaService.client.booking.findUnique({ where: { id } });
    if (!existing) return { success: false, message: 'Booking not found' };

    if (!this.isAllowedTransition(existing.status, dto.status)) {
      return { success: false, message: 'Invalid status transition' };
    }

    const data: Record<string, unknown> = {
      status: dto.status as any,
      rejectedAt: new Date(dto.rejectedAt),
      managerNotes: dto.managerNotes,
    };

    if (typeof dto.cancellationReason === 'string') data.cancellationReason = dto.cancellationReason;

    const updated = await (this.prismaService.client.booking as any).update({
      where: { id },
      data,
    });

    await this.syncUnitStatusFromBookingStatus(existing.unitId, dto.status);

    return { success: true, data: updated, message: 'Booking rejected successfully' };
  }

  async cancelBooking(id: string, dto: CancelBookingDto): Promise<ApiSuccess<unknown> | ApiError> {
    const existing = await this.prismaService.client.booking.findUnique({ where: { id } });
    if (!existing) return { success: false, message: 'Booking not found' };

    if (!this.isAllowedTransition(existing.status, dto.status)) {
      return { success: false, message: 'Invalid status transition' };
    }

    const updated = await (this.prismaService.client.booking as any).update({
      where: { id },
      data: {
        status: dto.status as any,
        cancelledAt: new Date(dto.cancelledAt),
        cancellationReason: dto.cancellationReason,
      },
    });

    await this.syncUnitStatusFromBookingStatus(existing.unitId, dto.status);

    await this.prismaService.client.payment.updateMany({
      where: {
        bookingId: id,
        status: { in: ['Pending', 'Received', 'Overdue'] as any },
      },
      data: {
        status: 'Refunded' as any,
      },
    });

    return { success: true, data: updated, message: 'Booking cancelled successfully' };
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

    await this.syncUnitStatusFromBookingStatus(existing.unitId, dto.status);

    return {
      success: true,
      data: updated,
      message: 'Booking status updated successfully',
    };
  }
}
