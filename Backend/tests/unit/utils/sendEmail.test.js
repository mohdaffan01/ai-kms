import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import { sendEmail } from '../../../src/utils/sendEmail.js';

describe('Utils: sendEmail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return NO_CREDENTIALS if EMAIL_PASS is not provided', async () => {
    const originalPass = process.env.EMAIL_PASS;
    delete process.env.EMAIL_PASS;

    const result = await sendEmail({
      to: 'student@example.com',
      subject: 'Password Reset',
      text: 'Your reset code is 123456',
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('NO_CREDENTIALS');

    process.env.EMAIL_PASS = originalPass;
  });

  it('should deliver email successfully when credentials are provided', async () => {
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'abcdefghijklmnop';

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'msg_12345' });
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
    });

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'AiKMS Notification',
      text: 'Notification body text',
      html: '<p>Notification body text</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg_12345');
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'recipient@example.com',
        subject: 'AiKMS Notification',
      })
    );
  });

  it('should gracefully handle Nodemailer sendMail failure without throwing', async () => {
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'abcdefghijklmnop';

    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: vi.fn().mockRejectedValue(new Error('SMTP Auth failure')),
    });

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'AiKMS Notification',
      text: 'Text',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('SMTP Auth failure');
  });
});
