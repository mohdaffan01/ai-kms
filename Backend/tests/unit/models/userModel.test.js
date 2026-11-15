import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import User from '../../../src/models/user.model.js';

describe('Model: User', () => {
  it('should correctly match valid and invalid passwords via matchPassword method', async () => {
    const plainPassword = 'StrongPassword123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const userInstance = new User({
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: hashedPassword,
    });

    const isMatch = await userInstance.matchPassword('StrongPassword123!');
    const isWrongMatch = await userInstance.matchPassword('WrongPassword999!');

    expect(isMatch).toBe(true);
    expect(isWrongMatch).toBe(false);
  });

  it('should generate a 6-digit numeric OTP and set 10-minute expiry with generateResetOtp', () => {
    const userInstance = new User({
      name: 'Bob Jones',
      email: 'bob@example.com',
      password: 'DummyPassword123!',
    });

    const otp = userInstance.generateResetOtp();

    expect(otp).toBeDefined();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
    expect(userInstance.resetPasswordOtp).toBeDefined();
    expect(userInstance.resetPasswordOtpExpire).toBeDefined();
    expect(userInstance.resetPasswordOtpExpire.getTime()).toBeGreaterThan(Date.now());
  });

  it('should generate a 40-character hex reset token with 30-minute expiry with getResetPasswordToken', () => {
    const userInstance = new User({
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      password: 'DummyPassword123!',
    });

    const resetToken = userInstance.getResetPasswordToken();

    expect(resetToken).toBeDefined();
    expect(resetToken).toHaveLength(40);
    expect(userInstance.resetPasswordToken).toBeDefined();
    expect(userInstance.resetPasswordExpire).toBeDefined();
    expect(userInstance.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());
  });
});
