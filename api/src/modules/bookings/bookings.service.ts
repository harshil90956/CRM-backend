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

export type CreateBookingDto = {
  unitId: string;
  customerId: string;
};

export type UpdateBookingStatusDto = {
  status: 'HOLD' | 'BOOKED' | 'CANCELLED';
};

@Injectable()
export class BookingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateBookingDto): Promise<ApiSuccess<unknown>> {
    const booking = await this.prismaService.client.booking.create({
      data: {
        unitId: dto.unitId,
        customerId: dto.customerId,
        status: 'HOLD_REQUESTED' as any,
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
    const mappedStatus = dto.status === 'HOLD' ? 'HOLD_REQUESTED' : dto.status;

    const existing = await this.prismaService.client.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: 'Booking not found',
      };
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
