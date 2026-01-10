import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  private isUuid(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && Boolean(value.trim());
  }

  private isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
    return typeof value === 'string' && (allowed as readonly string[]).includes(value);
  }

  private isRating(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 5;
  }

  // ADMIN (moderation)
  @Get('admin/reviews')
  adminList() {
    return this.reviewsService.adminList();
  }

  @Get('admin/reviews/stats')
  adminStats() {
    return this.reviewsService.adminStats();
  }

  @Patch('admin/reviews/:id/approve')
  adminApprove(@Param('id') id: string, @Body() body: any) {
    if (!this.isUuid(id)) return { success: false, message: 'Invalid review id' };

    const status = body?.status;
    if (status !== undefined && !this.isOneOf(status, ['approved', 'rejected'] as const)) {
      return { success: false, message: 'Invalid status' };
    }

    const nextStatus = (status ?? 'approved') as 'approved' | 'rejected';
    return this.reviewsService.adminApproveOrReject(id, nextStatus);
  }

  @Delete('admin/reviews/:id')
  adminDelete(@Param('id') id: string) {
    if (!this.isUuid(id)) return { success: false, message: 'Invalid review id' };
    return this.reviewsService.adminDelete(id);
  }

  // MANAGER (read-only)
  @Get('manager/reviews')
  managerList() {
    return this.reviewsService.managerList();
  }

  @Get('manager/reviews/stats')
  managerStats() {
    return this.reviewsService.managerStats();
  }

  // AGENT (read-only self)
  @Get('agent/reviews')
  agentList(@Query('agentId') agentId?: string) {
    if (!this.isUuid(agentId)) return { success: true, data: [], message: 'Reviews fetched successfully' };
    return this.reviewsService.agentList(agentId);
  }

  // PUBLIC (project reviews)
  @Get('public/reviews')
  publicList(
    @Query('type') type?: string,
    @Query('targetId') targetId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (type !== 'project') {
      return {
        success: true,
        data: { data: [], meta: { total: 0, limit: 10, offset: 0 } },
        message: 'Reviews fetched successfully',
      };
    }

    if (!this.isNonEmptyString(targetId) || !this.isNonEmptyString(tenantId)) {
      return {
        success: true,
        data: { data: [], meta: { total: 0, limit: 10, offset: 0 } },
        message: 'Reviews fetched successfully',
      };
    }

    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(50, parsedLimit)) : 10;
    const parsedOffset = Number(offset);
    const safeOffset = Number.isFinite(parsedOffset) ? Math.max(0, Math.floor(parsedOffset)) : 0;

    return this.reviewsService.publicListOffset({
      type: 'project',
      targetId: String(targetId),
      tenantId: String(tenantId),
      limit: safeLimit,
      offset: safeOffset,
    });
  }

  // CUSTOMER
  @Post('customer/reviews')
  customerCreate(@Body() body: any) {
    if (!this.isOneOf(body?.type, ['property', 'agent', 'project'] as const)) return { success: false, message: 'Invalid type' };
    if (!this.isNonEmptyString(body?.targetId)) return { success: false, message: 'Invalid targetId' };
    if (!this.isUuid(body?.customerId)) return { success: false, message: 'Invalid customerId' };
    if (!this.isRating(body?.rating)) return { success: false, message: 'Invalid rating' };
    if (!this.isNonEmptyString(body?.comment) || String(body.comment).length < 10) return { success: false, message: 'Invalid comment' };
    if (!this.isNonEmptyString(body?.tenantId)) return { success: false, message: 'Invalid tenantId' };

    return this.reviewsService.customerCreate({
      type: body.type,
      targetId: body.targetId,
      customerId: body.customerId,
      rating: body.rating,
      comment: body.comment,
      images: body.images,
      tenantId: body.tenantId,
    });
  }

  @Get('customer/reviews')
  customerList(@Query('customerId') customerId?: string) {
    if (!this.isUuid(customerId)) return { success: true, data: [], message: 'Reviews fetched successfully' };
    return this.reviewsService.customerList(customerId);
  }

  @Patch('customer/reviews/:id')
  customerUpdate(@Param('id') id: string, @Body() body: any) {
    if (!this.isUuid(id)) return { success: false, message: 'Invalid review id' };
    if (!this.isUuid(body?.customerId)) return { success: false, message: 'Invalid customerId' };

    if (body?.delete !== undefined && typeof body.delete !== 'boolean') {
      return { success: false, message: 'Invalid delete flag' };
    }

    if (body?.rating !== undefined && !this.isRating(body.rating)) return { success: false, message: 'Invalid rating' };
    if (body?.comment !== undefined) {
      if (!this.isNonEmptyString(body.comment) || String(body.comment).length < 10) return { success: false, message: 'Invalid comment' };
    }

    return this.reviewsService.customerUpdate(id, body.customerId, {
      rating: body.rating,
      comment: body.comment,
      images: body.images,
      delete: body.delete,
    });
  }
}
