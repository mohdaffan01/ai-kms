import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerUser, loginUser, getUserProfile } from '../../../src/controllers/user.Controller.js';
import { userRepository } from '../../../src/repositories/user.repository.js';
import { mockUser } from '../../fixtures/sampleData.js';

describe('Controller: auth (user.Controller)', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, user: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should reject registration if required fields are missing', async () => {
      req.body = { name: 'John' }; // missing email and password

      await registerUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('Please fill in all required fields');
    });

    it('should reject registration if name contains numbers or special symbols', async () => {
      req.body = {
        name: 'John123',
        email: 'john@example.com',
        password: 'Password123!',
      };

      await registerUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('Name must contain only alphabets and spaces');
    });

    it('should reject registration if password does not meet complexity requirements', async () => {
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weakpassword',
      };

      await registerUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject registration if user with email already exists', async () => {
      req.body = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'Password123!',
      };

      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);

      await registerUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('User already exists');
    });

    it('should successfully register a valid user and return 201 with token', async () => {
      req.body = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      };

      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(userRepository, 'create').mockResolvedValue({
        _id: 'new_user_123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'student',
      });

      await registerUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'new_user_123',
          name: 'Jane Doe',
          email: 'jane@example.com',
          token: expect.any(String),
        })
      );
    });
  });

  describe('loginUser', () => {
    it('should reject login if email or password is missing', async () => {
      req.body = { email: 'john@example.com' };

      await loginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject login if credentials do not match', async () => {
      req.body = { email: 'john@example.com', password: 'WrongPassword123!' };

      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue({
        ...mockUser,
        matchPassword: vi.fn().mockResolvedValue(false),
      });

      await loginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('Invalid email or password');
    });

    it('should login successfully with valid credentials and return JWT token', async () => {
      req.body = { email: 'johndoe@example.com', password: 'CorrectPassword123!' };

      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue({
        ...mockUser,
        matchPassword: vi.fn().mockResolvedValue(true),
      });

      await loginUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          token: expect.any(String),
        })
      );
    });
  });

  describe('getUserProfile', () => {
    it('should return profile of currently authenticated user without password', async () => {
      req.user = { _id: mockUser._id };

      vi.spyOn(userRepository, 'findByIdWithoutPassword').mockResolvedValue(mockUser);

      await getUserProfile(req, res, next);

      expect(userRepository.findByIdWithoutPassword).toHaveBeenCalledWith(mockUser._id);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });
});
