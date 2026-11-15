import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import app from '../../src/app.js';
import { documentRepository } from '../../src/repositories/document.repository.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { progressRepository } from '../../src/repositories/progress.repository.js';
import generateToken from '../../src/utils/generateToken.js';
import { mockUser, mockDocument } from '../fixtures/sampleData.js';

describe('Integration: Document Management API', () => {
  let authToken;

  beforeEach(() => {
    vi.restoreAllMocks();
    authToken = generateToken(mockUser._id);
    vi.spyOn(userRepository, 'findByIdWithoutPassword').mockResolvedValue(mockUser);
  });

  describe('GET /api/documents/my-documents', () => {
    it('should return 401 if request is unauthenticated', async () => {
      const response = await request(app).get('/api/documents/my-documents');
      expect(response.status).toBe(401);
    });

    it('should return 200 with user documents list when authenticated', async () => {
      const mockQueryChain = {
        sort: vi.fn().mockResolvedValue([mockDocument]),
      };
      vi.spyOn(documentRepository, 'find').mockReturnValue(mockQueryChain);

      const response = await request(app)
        .get('/api/documents/my-documents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.documents[0].title).toBe(mockDocument.title);
    });
  });

  describe('POST /api/documents/upload', () => {
    it('should return 400 if no file is attached in multipart request', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Process Scheduling')
        .field('subject', 'Operating Systems');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Please upload a valid document file');
    });

    it('should return 400 if title or subject is missing', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('Valid content of notes'), 'notes.txt');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Title and subject are required');
    });

    it('should upload valid text document and return 201', async () => {
      vi.spyOn(progressRepository, 'findOne').mockResolvedValue(null);
      vi.spyOn(documentRepository, 'create').mockResolvedValue({
        _id: 'new_doc_id',
        title: 'CPU Scheduling Notes',
        subject: 'Operating Systems',
        uploadedBy: mockUser._id,
      });

      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'CPU Scheduling Notes')
        .field('subject', 'Operating Systems')
        .attach('file', Buffer.from('Extensive notes on FCFS, Round Robin, and SJF scheduling algorithms.'), 'lecture.txt');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Document uploaded successfully.');
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('should return 404 if document does not exist', async () => {
      vi.spyOn(documentRepository, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/documents/missing_doc_id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Document not found.');
    });

    it('should return 403 if document belongs to another user', async () => {
      vi.spyOn(documentRepository, 'findById').mockResolvedValue({
        ...mockDocument,
        uploadedBy: 'other_user_id',
      });

      const response = await request(app)
        .delete(`/api/documents/${mockDocument._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should delete document and return 200 on authorized delete', async () => {
      vi.spyOn(documentRepository, 'findById').mockResolvedValue(mockDocument);
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.spyOn(documentRepository, 'findByIdAndDelete').mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/documents/${mockDocument._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Document deleted successfully.');
    });
  });
});
