import { describe, it, expect } from 'vitest';
import uploadDocumentMiddleware from '../../../src/middleware/uploadMiddleware.js';

describe('Middleware: uploadMiddleware', () => {
  it('should be configured with 20MB file size limit', () => {
    expect(uploadDocumentMiddleware).toBeDefined();
    // 20MB = 20 * 1024 * 1024 = 20971520 bytes
    expect(uploadDocumentMiddleware.limits.fileSize).toBe(20 * 1024 * 1024);
  });

  it('should accept supported study document formats (PDF, DOCX, TXT, MD)', () => {
    const fileFilter = uploadDocumentMiddleware.fileFilter;
    const allowedFiles = [
      { originalname: 'lecture.pdf', mimetype: 'application/pdf' },
      { originalname: 'notes.docx', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      { originalname: 'summary.txt', mimetype: 'text/plain' },
      { originalname: 'readme.md', mimetype: 'text/markdown' },
    ];

    allowedFiles.forEach((file) => {
      let accepted = false;
      fileFilter({}, file, (err, pass) => {
        if (!err && pass === true) accepted = true;
      });
      expect(accepted).toBe(true);
    });
  });

  it('should reject prohibited and dangerous file formats (EXE, JS, SH, HTML)', () => {
    const fileFilter = uploadDocumentMiddleware.fileFilter;
    const prohibitedFiles = [
      { originalname: 'virus.exe', mimetype: 'application/x-msdownload' },
      { originalname: 'script.js', mimetype: 'application/javascript' },
      { originalname: 'exploit.sh', mimetype: 'application/x-sh' },
      { originalname: 'page.html', mimetype: 'text/html' },
    ];

    prohibitedFiles.forEach((file) => {
      let rejected = false;
      fileFilter({}, file, (err, pass) => {
        if (err && !pass) rejected = true;
      });
      expect(rejected).toBe(true);
    });
  });
});
