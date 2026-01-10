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

export type ReviewStatusLike = 'pending' | 'approved' | 'rejected' | string;
export type ReviewTypeLike = 'property' | 'agent' | 'project' | string;

export type ReviewUi = {
  id: string;
  type: 'property' | 'agent' | 'project';
  targetId: string;
  targetName: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  tenantId: string;
  createdAt: string;
};

type ReviewsStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  avgRating: string;
};

type PublicReviewsResult = {
  items: ReviewUi[];
  nextCursor: string | null;
};

type PublicReviewsOffsetResult = {
  data: ReviewUi[];
  meta: { total: number; limit: number; offset: number };
};

@Injectable()
export class ReviewsService {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly reviewSelectWithCustomerName = {
    id: true,
    type: true,
    targetId: true,
    customerId: true,
    rating: true,
    comment: true,
    status: true,
    tenantId: true,
    createdAt: true,
    customer: { select: { name: true } },
  } as const;

  private formatErrorMessage(err: unknown): string {
    const anyErr = err as any;
    const code = anyErr?.code ? String(anyErr.code) : '';
    const message = anyErr?.message ? String(anyErr.message) : '';
    const meta = anyErr?.meta ? JSON.stringify(anyErr.meta) : '';
    const parts = [code && `code=${code}`, message && message, meta && `meta=${meta}`].filter(Boolean);
    return parts.length ? parts.join(' | ') : 'Failed to create review';
  }

  async publicListOffset(input: {
    type: 'project';
    targetId: string;
    tenantId: string;
    limit: number;
    offset: number;
  }): Promise<ApiSuccess<PublicReviewsOffsetResult>> {
    const limit = Math.max(1, Math.min(50, Number(input.limit) || 10));
    const offset = Math.max(0, Math.floor(Number(input.offset) || 0));

    const where: any = {
      type: input.type as any,
      targetId: String(input.targetId || ''),
      tenantId: String(input.tenantId || ''),
      status: 'approved' as any,
    };

    if (!where.targetId || !where.tenantId) {
      return {
        success: true,
        data: { data: [], meta: { total: 0, limit, offset } },
        message: 'Reviews fetched successfully',
      };
    }

    try {
      const [total, rows] = await Promise.all([
        this.prismaService.client.review.count({ where }),
        this.prismaService.client.review.findMany({
          where,
          select: this.reviewSelectWithCustomerName as any,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
      ]);

      const mapped = await Promise.all(rows.map((r) => this.toUi(r)));
      return {
        success: true,
        data: { data: mapped, meta: { total, limit, offset } },
        message: 'Reviews fetched successfully',
      };
    } catch {
      return {
        success: true,
        data: { data: [], meta: { total: 0, limit, offset } },
        message: 'Reviews fetched successfully',
      };
    }
  }

  private isMissingColumnError(err: unknown, columnName: string): boolean {
    const anyErr = err as any;
    const msg = String(anyErr?.message ?? '');
    return anyErr?.code === 'P2022' && msg.toLowerCase().includes(columnName.toLowerCase());
  }

  private encodeCursor(createdAt: Date, id: string): string {
    return `${createdAt.toISOString()}|${id}`;
  }

  private decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
    try {
      const [createdAtRaw, idRaw] = String(cursor || '').split('|');
      if (!createdAtRaw || !idRaw) return null;
      const createdAt = new Date(createdAtRaw);
      if (Number.isNaN(createdAt.getTime())) return null;
      return { createdAt, id: String(idRaw) };
    } catch {
      return null;
    }
  }

  async publicList(input: {
    type: 'project' | 'property';
    targetId: string;
    tenantId: string;
    limit: number;
    cursor?: string;
    status?: 'approved';
  }): Promise<ApiSuccess<PublicReviewsResult>> {
    const limit = Math.max(1, Math.min(50, Number(input.limit) || 10));
    const status = input.status;
    const decoded = input.cursor ? this.decodeCursor(input.cursor) : null;

    const baseWhere: any = {
      type: input.type as any,
      targetId: input.targetId,
      tenantId: input.tenantId,
      ...(status ? { status: status as any } : {}),
    };

    const where = decoded
      ? {
          AND: [
            baseWhere,
            {
              OR: [
                { createdAt: { lt: decoded.createdAt } },
                { createdAt: decoded.createdAt, id: { lt: decoded.id } },
              ],
            },
          ],
        }
      : baseWhere;

    const rows = await this.prismaService.client.review.findMany({
      where,
      select: this.reviewSelectWithCustomerName as any,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const items = await Promise.all(slice.map((r) => this.toUi(r)));

    const nextCursor = hasMore
      ? this.encodeCursor(new Date((slice[slice.length - 1] as any).createdAt), String((slice[slice.length - 1] as any).id))
      : null;

    return { success: true, data: { items, nextCursor }, message: 'Reviews fetched successfully' };
  }

  private normalizeStatus(status: ReviewStatusLike): 'pending' | 'approved' | 'rejected' {
    const v = String(status);
    if (v === 'approved' || v === 'rejected' || v === 'pending') return v;
    return 'pending';
  }

  private normalizeType(type: ReviewTypeLike): 'property' | 'agent' | 'project' {
    const v = String(type);
    if (v === 'agent') return 'agent';
    if (v === 'project') return 'project';
    return 'property';
  }

  private toImages(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((x) => String(x)).filter(Boolean).slice(0, 3);
    return [];
  }

  private async resolveTargetName(type: 'property' | 'agent' | 'project', targetId: string): Promise<string> {
    if (type === 'project') {
      const p = await this.prismaService.client.project.findUnique({
        where: { id: targetId },
        select: { name: true },
      });
      return p?.name ?? '';
    }

    if (type === 'property') {
      const u = await this.prismaService.client.unit.findUnique({
        where: { id: targetId },
        select: { unitNo: true },
      });
      return u?.unitNo ?? '';
    }

    const u = await this.prismaService.client.user.findUnique({
      where: { id: targetId },
      select: { name: true },
    });
    return u?.name ?? '';
  }

  private async toUi(r: any): Promise<ReviewUi> {
    const type = this.normalizeType(r?.type);
    const targetId = String(r?.targetId ?? '');
    const targetName = (await this.resolveTargetName(type, targetId)) || String(r?.targetName ?? '');
    const customerName = String(r?.customer?.name ?? r?.customerName ?? '');
    const createdAt = r?.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString();
    const images: string[] = [];

    return {
      id: String(r?.id),
      type,
      targetId,
      targetName,
      customerId: String(r?.customerId ?? ''),
      customerName,
      rating: Number(r?.rating) || 0,
      comment: String(r?.comment ?? ''),
      images: images.length ? images : undefined,
      status: this.normalizeStatus(r?.status),
      tenantId: String(r?.tenantId ?? ''),
      createdAt,
    };
  }

  private async listRaw(where: any): Promise<any[]> {
    try {
      return (await this.prismaService.client.review.findMany({
        where,
        select: this.reviewSelectWithCustomerName as any,
        orderBy: { createdAt: 'desc' },
      })) as any;
    } catch (err) {
      return [];
    }
  }

  private async statsFrom(where: any): Promise<ReviewsStats> {
    const rows = await this.prismaService.client.review.findMany({
      where,
      select: { rating: true, status: true },
    });

    const total = rows.length;
    const pending = rows.filter((r) => r.status === 'pending').length;
    const approved = rows.filter((r) => r.status === 'approved').length;
    const rejected = rows.filter((r) => r.status === 'rejected').length;
    const avgRating = total > 0 ? (rows.reduce((s, r) => s + (Number(r.rating) || 0), 0) / total).toFixed(1) : '0.0';

    return { total, pending, approved, rejected, avgRating };
  }

  async adminList(): Promise<ApiSuccess<ReviewUi[]>> {
    try {
      const rows = await this.listRaw({});
      const mapped = await Promise.all(rows.map((r) => this.toUi(r)));
      return { success: true, data: mapped, message: 'Reviews fetched successfully' };
    } catch {
      return { success: true, data: [], message: 'Reviews fetched successfully' };
    }
  }

  async adminStats(): Promise<ApiSuccess<ReviewsStats>> {
    const stats = await this.statsFrom({});
    return { success: true, data: stats, message: 'Review stats fetched successfully' };
  }

  async managerList(): Promise<ApiSuccess<ReviewUi[]>> {
    try {
      const rows = await this.listRaw({});
      const mapped = await Promise.all(rows.map((r) => this.toUi(r)));
      return { success: true, data: mapped, message: 'Reviews fetched successfully' };
    } catch {
      return { success: true, data: [], message: 'Reviews fetched successfully' };
    }
  }

  async managerStats(): Promise<ApiSuccess<ReviewsStats>> {
    const stats = await this.statsFrom({});
    return { success: true, data: stats, message: 'Review stats fetched successfully' };
  }

  async agentList(agentId: string): Promise<ApiSuccess<ReviewUi[]>> {
    try {
      const rows = await this.listRaw({ type: 'agent', targetId: agentId, status: 'approved' });
      const mapped = await Promise.all(rows.map((r) => this.toUi(r)));
      return { success: true, data: mapped, message: 'Reviews fetched successfully' };
    } catch {
      return { success: true, data: [], message: 'Reviews fetched successfully' };
    }
  }

  async customerList(customerId: string): Promise<ApiSuccess<ReviewUi[]>> {
    try {
      const rows = await this.listRaw({ customerId });
      const mapped = await Promise.all(rows.map((r) => this.toUi(r)));
      return { success: true, data: mapped, message: 'Reviews fetched successfully' };
    } catch {
      return { success: true, data: [], message: 'Reviews fetched successfully' };
    }
  }

  async customerCreate(input: {
    type: 'property' | 'agent' | 'project';
    targetId: string;
    customerId: string;
    rating: number;
    comment: string;
    images?: unknown;
    tenantId: string;
  }): Promise<ApiSuccess<ReviewUi> | ApiError> {
    try {
      const customer = await this.prismaService.client.user.findUnique({
        where: { id: input.customerId },
        select: { id: true, name: true },
      });
      if (!customer) return { success: false, message: 'Customer not found' };

      const baseData: any = {
        type: input.type as any,
        targetId: input.targetId,
        customerId: input.customerId,
        rating: input.rating,
        comment: input.comment,
        status: 'approved' as any,
        tenantId: input.tenantId,
      };

      const created = await this.prismaService.client.review.create({
        data: baseData,
        select: this.reviewSelectWithCustomerName as any,
      });
      return { success: true, data: await this.toUi(created), message: 'Review created successfully' };
    } catch (err) {
      return { success: false, message: this.formatErrorMessage(err) };
    }
  }

  async customerUpdate(
    id: string,
    customerId: string,
    input: { rating?: number; comment?: string; images?: unknown; delete?: boolean },
  ): Promise<ApiSuccess<ReviewUi> | ApiSuccess<{ id: string }> | ApiError> {
    try {
      const existing = await this.prismaService.client.review.findUnique({
        where: { id },
        select: this.reviewSelectWithCustomerName as any,
      });
      if (!existing) return { success: false, message: 'Review not found' };
      if (String(existing.customerId) !== String(customerId)) return { success: false, message: 'Unauthorized' };
      if (existing.status !== 'pending' && existing.status !== 'approved') {
        return { success: false, message: 'Only pending/approved reviews can be edited' };
      }

      if (input.delete === true) {
        await this.prismaService.client.review.delete({ where: { id } });
        return { success: true, data: { id }, message: 'Review deleted successfully' };
      }

      const baseData: any = {
        rating: typeof input.rating === 'number' ? input.rating : undefined,
        comment: typeof input.comment === 'string' ? input.comment : undefined,
      };

      const updated = await this.prismaService.client.review.update({
        where: { id },
        data: baseData,
        select: this.reviewSelectWithCustomerName as any,
      });
      return { success: true, data: await this.toUi(updated), message: 'Review updated successfully' };
    } catch {
      return { success: false, message: 'Failed to update review' };
    }
  }

  async adminApproveOrReject(id: string, nextStatus: 'approved' | 'rejected'): Promise<ApiSuccess<ReviewUi> | ApiError> {
    const existing = await this.prismaService.client.review.findUnique({
      where: { id },
      select: this.reviewSelectWithCustomerName as any,
    });
    if (!existing) return { success: false, message: 'Review not found' };

    const updated = await this.prismaService.client.review.update({
      where: { id },
      data: { status: nextStatus as any },
      select: this.reviewSelectWithCustomerName as any,
    });

    return {
      success: true,
      data: await this.toUi(updated),
      message: nextStatus === 'approved' ? 'Review approved successfully' : 'Review rejected successfully',
    };
  }

  async adminDelete(id: string): Promise<ApiSuccess<{ id: string }> | ApiError> {
    const existing = await this.prismaService.client.review.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return { success: false, message: 'Review not found' };

    await this.prismaService.client.review.delete({ where: { id } });
    return { success: true, data: { id }, message: 'Review deleted successfully' };
  }
}
