import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/core/database/prisma/prisma.service';

jest.setTimeout(30000);

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('Missing DATABASE_URL for e2e tests');
    }
    process.env.JWT_SECRET ||= 'test_jwt_secret';
    process.env.AUTH_DEFAULT_TENANT_ID ||= 'tenant_default';
    process.env.AUTH_DEFAULT_NEW_USER_ROLE ||= 'CUSTOMER';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get(PrismaService);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('Send OTP -> record created', async () => {
    const email = `e2e_${Date.now()}@example.com`;

    await request(app.getHttpServer()).post('/auth/send-otp').send({ email }).expect(201);

    const record = await prismaService.client.emailOtp.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    expect(record).toBeTruthy();
    expect(record?.used).toBe(false);
    expect(record?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(record?.code).toMatch(/^[0-9]{6}$/);
  });

  it('Verify OTP -> JWT returned and /auth/me works', async () => {
    const email = `e2e_${Date.now()}@example.com`;

    await prismaService.client.user.create({
      data: {
        email,
        name: 'E2E User',
        role: 'CUSTOMER',
        tenantId: 'tenant_default',
      },
    });

    await request(app.getHttpServer()).post('/auth/send-otp').send({ email }).expect(201);

    const record = await prismaService.client.emailOtp.findFirst({
      where: { email, used: false },
      orderBy: { createdAt: 'desc' },
    });

    expect(record).toBeTruthy();

    const verifyRes = await request(app.getHttpServer())
      .post('/auth/verify-otp')
      .send({ email, otp: record?.code })
      .expect(201);

    expect(verifyRes.body?.accessToken).toBeTruthy();
    expect(verifyRes.body?.user?.id).toBeTruthy();
    expect(verifyRes.body?.user?.email).toBe(email);
    expect(verifyRes.body?.user?.tenantId).toBe('tenant_default');

    const token = verifyRes.body.accessToken as string;

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body?.id).toBeTruthy();
    expect(meRes.body?.email).toBe(email);
  });

  it('Invalid OTP rejected', async () => {
    const email = `e2e_${Date.now()}@example.com`;

    await prismaService.client.user.create({
      data: {
        email,
        name: 'E2E User',
        role: 'CUSTOMER',
        tenantId: 'tenant_default',
      },
    });

    await request(app.getHttpServer()).post('/auth/send-otp').send({ email }).expect(201);

    await request(app.getHttpServer())
      .post('/auth/verify-otp')
      .send({ email, otp: '000000' })
      .expect(400);
  });

  it('Expired OTP rejected', async () => {
    const email = `e2e_${Date.now()}@example.com`;

    await prismaService.client.user.create({
      data: {
        email,
        name: 'E2E User',
        role: 'CUSTOMER',
        tenantId: 'tenant_default',
      },
    });

    await prismaService.client.emailOtp.create({
      data: {
        email,
        code: '123456',
        used: false,
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    await request(app.getHttpServer())
      .post('/auth/verify-otp')
      .send({ email, otp: '123456' })
      .expect(400);
  });
});
