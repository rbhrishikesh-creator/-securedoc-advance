import request from 'supertest';
import app from '../src/app';

describe('API Health and Auth Endpoints', () => {
  it('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('POST /api/auth/register rejects missing fields with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'invalid@example.com',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('POST /api/auth/login rejects empty password with 400', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });
});
