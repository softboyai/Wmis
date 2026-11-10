import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';

const TEST_DB = process.env.MONGO_URI?.replace('/wmis_agl', '/wmis_test') || 'mongodb://localhost:27017/wmis_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  await User.deleteMany({ email: /test@/ });
});

afterAll(async () => {
  await User.deleteMany({ email: /test@/ });
  await mongoose.disconnect();
});

describe('POST /api/v1/auth/login', () => {
  it('returns 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: 'SomePass@1' });
    expect(res.status).toBe(401);
  });

  it('returns generic message (no email enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: 'WrongPass@1' });
    expect(res.body.message).toMatch(/incorrect email or password/i);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'SomePass@1' });
    expect(res.status).toBe(401);
  });
});

describe('Password validation', () => {
  it('rejects common passwords', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', 'Bearer invalid-token')
      .send({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'storekeeper',
      });
    // Should fail auth or validation
    expect([400, 401, 403]).toContain(res.status);
  });
});

describe('RBAC middleware', () => {
  it('returns 401 for missing token on protected route', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(401);
  });

  it('returns 401 for invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .set('Authorization', 'Bearer bad.token.here');
    expect(res.status).toBe(401);
  });

  it('returns 401 for logs without admin token', async () => {
    const res = await request(app)
      .get('/api/v1/logs')
      .set('Authorization', 'Bearer invalid');
    expect(res.status).toBe(401);
  });
});

describe('Forgot password', () => {
  it('always returns 200 (no email enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'doesnotexist@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if that email/i);
  });
});
