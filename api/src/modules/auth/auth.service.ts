import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { PrismaService } from '../../core/database/prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

type AuthUserResponse = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
};

type VerifyOtpResponse = {
  accessToken: string;
  user: AuthUserResponse;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly transporter: Transporter;
  private readonly otpFrom: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const host = this.configService.get<string>('SMTP_HOST')?.trim();
    const portRaw = this.configService.get<string>('SMTP_PORT')?.trim();
    const user = this.configService.get<string>('SMTP_USER')?.trim();
    const pass = this.configService.get<string>('SMTP_PASS')?.trim();
    const secureRaw = this.configService.get<string>('SMTP_SECURE')?.trim();
    const fromRaw = this.configService.get<string>('SMTP_FROM')?.trim();

    this.otpFrom = fromRaw || user || 'no-reply@crm.local';

    const port = portRaw ? Number(portRaw) : NaN;
    const secure = secureRaw ? secureRaw === 'true' : port === 465;

    if (host && Number.isFinite(port) && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    } else {
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(dto: SendOtpDto): Promise<{ success: true }> {
    const email = this.normalizeEmail(dto?.email ?? '');

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email');
    }

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prismaService.client.emailOtp.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    try {
      await this.transporter.sendMail({
        from: this.otpFrom,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP is ${code}. It expires in 5 minutes.`,
      });
      this.logger.log(`OTP email sent to ${email}`);
    } catch (e) {
      this.logger.error('Failed to send OTP email', e as any);
      throw new InternalServerErrorException('Failed to send OTP');
    }

    return { success: true };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    const email = this.normalizeEmail(dto?.email ?? '');
    const otp = (dto?.otp ?? '').trim();

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email');
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      throw new BadRequestException('Invalid otp');
    }

    const now = new Date();

    const otpRecord = await this.prismaService.client.emailOtp.findFirst({
      where: {
        email,
        code: otp,
        used: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired otp');
    }

    const user = await this.prismaService.client.$transaction(async (tx) => {
      await tx.emailOtp.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });

      const existing = await tx.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          isActive: true,
        },
      });

      if (existing) {
        if (!existing.isActive) {
          throw new UnauthorizedException('User is inactive');
        }
        return existing;
      }

      const defaultTenantId = this.configService.get<string>('AUTH_DEFAULT_TENANT_ID')?.trim();
      const defaultRole = this.configService.get<string>('AUTH_DEFAULT_NEW_USER_ROLE')?.trim();

      if (!defaultTenantId || !defaultRole) {
        throw new BadRequestException('Missing AUTH_DEFAULT_TENANT_ID or AUTH_DEFAULT_NEW_USER_ROLE');
      }

      const allowedRoles = new Set(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT', 'CUSTOMER']);
      if (!allowedRoles.has(defaultRole)) {
        throw new BadRequestException('Invalid AUTH_DEFAULT_NEW_USER_ROLE');
      }

      const created = await tx.user.create({
        data: {
          email,
          name: email,
          role: defaultRole as any,
          tenantId: defaultTenantId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          isActive: true,
        },
      });

      return created;
    });

    const accessToken = this.jwtService.sign({
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
        tenantId: user.tenantId,
      },
    };
  }

  async me(userId: string): Promise<AuthUserResponse> {
    const user = await this.prismaService.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Unauthorized');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      tenantId: user.tenantId,
    };
  }
}
