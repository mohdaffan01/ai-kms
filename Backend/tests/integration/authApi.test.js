import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import generateToken from '../../src/utils/generateToken.js';
import { mockUser } from '../fixtures/sampleData.js';

describe('Integration: Authentication & User API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET / (Server Health Check)', () => {
    it('should return 200 OK and health status message', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'AiKMS API Server is running smoothly',
      });
    });
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Incomplete' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Please fill in all required fields');
    });

    it('should return 400 if user with email already exists', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'johndoe@example.com',
          password: 'StrongPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });

    it('should register successfully and return 201 with auth token', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(userRepository, 'create').mockResolvedValue({
        _id: 'new_registered_user_id',
        name: 'New Student',
        email: 'student@example.com',
        role: 'student',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Student',
          email: 'student@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe('student@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue({
        ...mockUser,
        matchPassword: vi.fn().mockResolvedValue(false),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'johndoe@example.com',
          password: 'IncorrectPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return 200 with JWT token for valid credentials', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue({
        ...mockUser,
        matchPassword: vi.fn().mockResolvedValue(true),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'johndoe@example.com',
          password: 'CorrectPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe(mockUser.email);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 if no authorization header is provided', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('no token provided');
    });

    it('should return 200 with user profile when valid Bearer token is provided', async () => {
      const validToken = generateToken(mockUser._id);
      vi.spyOn(userRepository, 'findByIdWithoutPassword').mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(mockUser.email);
      expect(response.body.name).toBe(mockUser.name);
    });
  });

  describe('POST /api/auth/google', () => {
    it('should return 400 if credential is missing', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('credential/ID token is required');
    });

    it('should return 401 if Google rejects credential', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error_description: 'Bad token' }),
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'invalid_token_123' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Bad token');
    });

    it('should authenticate valid Google credential and return 200 with JWT token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          sub: 'google_sub_999',
          email: 'googleuser@gmail.com',
          name: 'Google Student',
          picture: 'https://lh3.googleusercontent.com/avatar.png',
          email_verified: true,
        }),
      });

      vi.spyOn(userRepository, 'findByGoogleId').mockResolvedValue(null);
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(userRepository, 'create').mockResolvedValue({
        _id: 'user_created_via_google_api',
        name: 'Google Student',
        email: 'googleuser@gmail.com',
        googleId: 'google_sub_999',
        authProvider: 'google',
        role: 'student',
        profileImage: 'https://lh3.googleusercontent.com/avatar.png',
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid_google_jwt_credential' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe('googleuser@gmail.com');
      expect(response.body.authProvider).toBe('google');
    });
  });
});
