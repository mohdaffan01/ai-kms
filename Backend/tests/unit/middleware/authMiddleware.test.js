import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { protect } from '../../../src/middleware/authMiddleware.js';
import { userRepository } from '../../../src/repositories/user.repository.js';
import { mockUser } from '../../fixtures/sampleData.js';

describe('Middleware: authMiddleware (protect)', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: vi.fn().mockReturnThis() };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('should call next() and attach req.user when valid Bearer token is provided', async () => {
    const token = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    vi.spyOn(userRepository, 'findByIdWithoutPassword').mockResolvedValue(mockUser);

    await protect(req, res, next);

    expect(userRepository.findByIdWithoutPassword).toHaveBeenCalledWith(mockUser._id);
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalledWith();
  });

  it('should return 401 if no Authorization header is provided', async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toContain('no token provided');
  });

  it('should return 401 if token is invalid or corrupted', async () => {
    req.headers.authorization = 'Bearer invalid-token-string';

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toContain('Not authorized');
  });

  it('should return 401 if user from decoded token does not exist in database', async () => {
    const token = jwt.sign({ id: 'non_existent_user_id' }, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    vi.spyOn(userRepository, 'findByIdWithoutPassword').mockResolvedValue(null);

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toContain('User not found or account removed');
  });
});
