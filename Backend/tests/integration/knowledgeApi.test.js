import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { documentRepository } from '../../src/repositories/document.repository.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import * as documentProcessor from '../../src/services/documentProcessor.js';
import * as embeddingService from '../../src/services/embeddingService.js';
import * as chromaService from '../../src/services/chromaService.js';
import generateToken from '../../src/utils/generateToken.js';
import { mockUser, mockDocument, mockEmbedding } from '../fixtures/sampleData.js';

describe('Integration: Knowledge & Grounded RAG Chat API', () => {
  let authToken;

  beforeEach(() => {
    vi.restoreAllMocks();
    authToken = generateToken(mockUser._id);
    vi.spyOn(userRepository, 'findByIdWithoutPassword').mockResolvedValue(mockUser);
  });

  describe('POST /api/knowledge/process/:documentId', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app).post('/api/knowledge/process/doc_123');
      expect(response.status).toBe(401);
    });

    it('should return 404 if document does not exist', async () => {
      vi.spyOn(documentRepository, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/knowledge/process/missing_doc_id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Document not found');
    });

    it('should return 403 if user is not the owner of the document', async () => {
      vi.spyOn(documentRepository, 'findById').mockResolvedValue({
        ...mockDocument,
        uploadedBy: 'different_user_id',
      });

      const response = await request(app)
        .post(`/api/knowledge/process/${mockDocument._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Not authorized to process this document');
    });

    it('should process document, extract, chunk, embed, and return 200 on success', async () => {
      const mockDocInstance = {
        ...mockDocument,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(documentRepository, 'findById').mockResolvedValue(mockDocInstance);
      vi.spyOn(documentProcessor, 'processDocument').mockResolvedValue({
        success: true,
        documentId: mockDocument._id,
        vectorized: true,
        totalChunks: 2,
        totalCharacters: 200,
      });

      const response = await request(app)
        .post(`/api/knowledge/process/${mockDocument._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('processed');
      expect(mockDocInstance.save).toHaveBeenCalled();
    });
  });

  describe('POST /api/knowledge/search', () => {
    it('should return 400 if query string is empty', async () => {
      const response = await request(app)
        .post('/api/knowledge/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('non-empty query string is required');
    });

    it('should generate embedding for query and return vector search results', async () => {
      vi.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue(mockEmbedding);
      vi.spyOn(chromaService, 'searchVectors').mockResolvedValue([
        {
          id: 'doc_1_0',
          score: 0.91,
          payload: {
            documentId: mockDocument._id,
            chunkIndex: 0,
            text: 'Relevant passage about CPU scheduling.',
            createdAt: '2026-11-14T10:00:00.000Z',
          },
        },
      ]);

      const response = await request(app)
        .post('/api/knowledge/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'How does process scheduling work?' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.totalMatches).toBe(1);
      expect(response.body.results[0].text).toContain('Relevant passage about CPU scheduling');
    });
  });

  describe('POST /api/knowledge/chat', () => {
    it('should respond warmly to casual greetings with study documents list', async () => {
      vi.spyOn(documentRepository, 'findUserDocuments').mockResolvedValue([mockDocument]);

      const response = await request(app)
        .post('/api/knowledge/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Hello!' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.answer).toContain('AiKMS Study Assistant');
      expect(response.body.sources).toContain(mockDocument.title);
    });

    it('should return helpful prompt to upload files if user has no study materials', async () => {
      vi.spyOn(documentRepository, 'findUserDocuments').mockResolvedValue([]);

      const response = await request(app)
        .post('/api/knowledge/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Explain paging' });

      expect(response.status).toBe(200);
      expect(response.body.answer).toContain('Please upload a PDF or document');
    });
  });

  describe('DELETE /api/knowledge/:documentId', () => {
    it('should delete vectors from ChromaDB and return 200', async () => {
      vi.spyOn(documentRepository, 'findById').mockResolvedValue(mockDocument);
      vi.spyOn(chromaService, 'deleteVectorsByDocument').mockResolvedValue({
        success: true,
        documentId: mockDocument._id,
      });

      const response = await request(app)
        .delete(`/api/knowledge/${mockDocument._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted from ChromaDB');
    });
  });
});
