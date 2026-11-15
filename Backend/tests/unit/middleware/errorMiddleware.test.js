import { describe, it, expect, vi } from 'vitest';
import { notFound, errorHandler } from '../../../src/middleware/errorMiddleware.js';

describe('Middleware: errorMiddleware', () => {
  describe('notFound', () => {
    it('should set res.status to 404 and call next with Error', () => {
      const req = { originalUrl: '/api/unknown-endpoint' };
      const res = {
        status: vi.fn().mockReturnThis(),
      };
      const next = vi.fn();

      notFound(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('Not Found - /api/unknown-endpoint');
    });
  });

  describe('errorHandler', () => {
    it('should respond with statusCode and JSON error message', () => {
      const err = new Error('Database connection failed');
      const req = {};
      const res = {
        statusCode: 400,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Database connection failed',
        })
      );
    });

    it('should default statusCode to 500 if current res.statusCode is 200', () => {
      const err = new Error('Unexpected crash');
      const req = {};
      const res = {
        statusCode: 200,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unexpected crash',
        })
      );
    });

    it('should hide error stack in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const err = new Error('Secure error');
      const req = {};
      const res = {
        statusCode: 500,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Secure error',
        stack: null,
      });

      process.env.NODE_ENV = originalEnv;
    });
  });
});
