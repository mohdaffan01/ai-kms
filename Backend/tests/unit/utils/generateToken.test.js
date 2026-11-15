import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import generateToken from '../../../src/utils/generateToken.js';

describe('Utils: generateToken', () => {
  it('should generate a valid JWT token with the provided user ID', () => {
    const userId = 'user_test_12345';
    const token = generateToken(userId);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(userId);
  });

  it('should set an expiration date on the token (30 days)', () => {
    const userId = 'user_test_99999';
    const token = generateToken(userId);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });
});
