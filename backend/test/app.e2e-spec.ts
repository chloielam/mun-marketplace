// test/app.e2e-spec.ts
import request from 'supertest';                      // ✅ default import
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', async () => {
    // If you don't have a /health route, either add one or change this path.
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ ok: true });
  });

  // ---------- 2️⃣ Google Auth Route ----------
  it('/auth/google (GET) should redirect to Google OAuth', async () => {
    const res = await request(app.getHttpServer()).get('/auth/google');
    expect([302, 301]).toContain(res.status); // Redirect expected
    expect(res.header.location).toContain('accounts.google.com'); // Optional if mock setup
  });

  // ---------- 3️⃣ Azure Auth Route ----------
  it('/auth/azure (GET) should redirect to Microsoft OAuth', async () => {
    const res = await request(app.getHttpServer()).get('/auth/azure');
    expect([302, 301]).toContain(res.status);
    expect(res.header.location).toContain('login.microsoftonline.com'); // Optional if mock setup
  });

  // ---------- 4️⃣ Google Callback (Mock) ----------
  it('/auth/google/callback (GET) should return user + token (mock)', async () => {
    // Since Passport needs a real Google redirect, we'll mock it
    // This test checks controller logic only if `req.user` is mocked
    const mockUser = {
      email: 'test@mun.ca',
      name: 'Test User',
      provider: 'google',
      providerId: '12345',
    };

    const mockReq = { user: mockUser };
    const res = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .set('mock-user', JSON.stringify(mockReq)) // custom header if you mock strategy
      .expect(200);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body.user.email).toBe('test@mun.ca');
  });

  afterAll(async () => {
    await app.close();
  });
});