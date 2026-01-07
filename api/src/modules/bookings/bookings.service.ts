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

  private mapRequestedStatus(status: UpdateBookingStatusDto['status']): string {
    return status === 'HOLD' ? 'HOLD_REQUESTED' : status;
  }

  private canTransition(current: unknown, next: unknown): boolean {
    if (current === next) {
      return true;
    }

    if (current === 'HOLD_REQUESTED') {
      return next === 'BOOKED' || next === 'CANCELLED';
    }

    if (current === 'HOLD_APPROVED') {
      return next === 'BOOKED' || next === 'CANCELLED';
    }

    if (current === 'BOOKED') {
      return next === 'CANCELLED';
    }

    return false;
  }

  async create(dto: CreateBookingDto): Promise<ApiSuccess<unknown> | ApiError> {
    const existingForUnit = await this.prismaService.client.booking.findFirst({
      where: {
        unitId: dto.unitId,
        status: { in: ['HOLD_REQUESTED', 'HOLD_APPROVED', 'BOOKED'] as any },
      },
    });

    if (existingForUnit) {
      if (existingForUnit.customerId === dto.customerId) {
        return {
          success: true,
          data: existingForUnit,
          message: 'Booking already exists for this unit and customer',
        };
      }

      return {
        success: false,
        message: 'Conflict: unit already has an active booking',
      };
    }

    const booking = await this.prismaService.client.booking.create({
      data: {
        unitId: dto.unitId,
        customerId: dto.customerId,
        projectId: dto.projectId,
        agentId: dto.agentId,
        managerId: dto.managerId,
        totalPrice: dto.totalPrice,
        tokenAmount: dto.tokenAmount,
        status: 'HOLD_REQUESTED',
        tenantId: dto.tenantId,
      },
    });

    return {
      success: true,
      data: booking,
      message: 'Booking created successfully',
    };
  }

  async findById(id: string): Promise<ApiSuccess<unknown> | ApiError> {
    const booking = await this.prismaService.client.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
      };
    }

    return {
      success: true,
      data: booking,
      message: 'Booking fetched successfully',
    };
  }

  async findAll(): Promise<ApiSuccess<unknown[]>> {
    const bookings = await this.prismaService.client.booking.findMany();

    return {
      success: true,
      data: bookings,
      message: 'Bookings fetched successfully',
    };
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<ApiSuccess<unknown> | ApiError> {
    const mappedStatus = this.mapRequestedStatus(dto.status);

    const existing = await this.prismaService.client.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: 'Booking not found',
      };
    }

    if (!this.canTransition(existing.status, mappedStatus)) {
      return {
        success: false,
        message: `Invalid state transition from ${existing.status} to ${mappedStatus}`,
      };
    }

    if (existing.status === mappedStatus) {
      return {
        success: true,
        data: existing,
        message: 'Booking status already set',
      };
    }

    if (mappedStatus === 'BOOKED') {
      const conflicting = await this.prismaService.client.booking.findFirst({
        where: {
          unitId: existing.unitId,
          id: { not: existing.id },
          status: { in: ['HOLD_REQUESTED', 'HOLD_APPROVED', 'BOOKED'] as any },
        },
      });

      if (conflicting) {
        return {
          success: false,
          message: 'Conflict: unit already has an active booking',
        };
      }
    }

    const updated = await this.prismaService.client.booking.update({
      where: { id },
      data: { status: mappedStatus as any },
    });

    return {
      success: true,
      data: updated,
      message: 'Booking status updated successfully',
    };
  }
}
