import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCollection = {
  upsert: vi.fn().mockResolvedValue(true),
  query: vi.fn().mockResolvedValue({
    ids: [['chunk_1']],
    distances: [[0.15]],
    metadatas: [[{ userId: 'user_1', documentId: 'doc_1', chunkIndex: 0 }]],
    documents: [['Sample matching content']],
  }),
  delete: vi.fn().mockResolvedValue(true),
};

vi.mock('chromadb', () => {
  return {
    ChromaClient: class {
      constructor() {}
      getOrCreateCollection() {
        return Promise.resolve(mockCollection);
      }
    },
  };
});

import * as chromaService from '../../../src/services/chromaService.js';

describe('Service: chromaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upsertVectors', () => {
    it('should return count 0 if points array is empty or invalid', async () => {
      const resEmpty = await chromaService.upsertVectors([]);
      const resNull = await chromaService.upsertVectors(null);

      expect(resEmpty).toEqual({ success: true, count: 0 });
      expect(resNull).toEqual({ success: true, count: 0 });
    });

    it('should format points and call collection.upsert on success', async () => {
      const points = [
        {
          id: 'doc1_0',
          vector: [0.1, 0.2, 0.3],
          payload: {
            userId: 'user1',
            documentId: 'doc1',
            chunkIndex: 0,
            text: 'Sample text chunk',
            charCount: 17,
          },
        },
      ];

      const result = await chromaService.upsertVectors(points);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(mockCollection.upsert).toHaveBeenCalledWith({
        ids: ['doc1_0'],
        embeddings: [[0.1, 0.2, 0.3]],
        documents: ['Sample text chunk'],
        metadatas: [
          expect.objectContaining({
            userId: 'user1',
            documentId: 'doc1',
            chunkIndex: 0,
          }),
        ],
      });
    });

    it('should gracefully handle collection upsert errors without crashing', async () => {
      mockCollection.upsert.mockRejectedValueOnce(new Error('Chroma upsert error'));

      const result = await chromaService.upsertVectors([{ id: '1', vector: [], payload: {} }]);

      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
    });
  });

  describe('searchVectors', () => {
    it('should query ChromaDB collection with userId filter and return mapped matches', async () => {
      const results = await chromaService.searchVectors('user_1', [0.1, 0.2, 0.3], 3);

      expect(mockCollection.query).toHaveBeenCalledWith({
        queryEmbeddings: [[0.1, 0.2, 0.3]],
        nResults: 3,
        where: { userId: 'user_1' },
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('chunk_1');
      expect(results[0].score).toBeCloseTo(0.85);
      expect(results[0].payload.text).toBe('Sample matching content');
    });

    it('should gracefully return empty array when ChromaDB search fails', async () => {
      mockCollection.query.mockRejectedValueOnce(new Error('Chroma query error'));

      const results = await chromaService.searchVectors('user_1', [0.1]);

      expect(results).toEqual([]);
    });
  });

  describe('deleteVectorsByDocument', () => {
    it('should delete points matching documentId from collection', async () => {
      const result = await chromaService.deleteVectorsByDocument('doc_to_delete');

      expect(mockCollection.delete).toHaveBeenCalledWith({
        where: { documentId: 'doc_to_delete' },
      });
      expect(result).toEqual({ success: true, documentId: 'doc_to_delete' });
    });

    it('should gracefully return failure object if delete throws error', async () => {
      mockCollection.delete.mockRejectedValueOnce(new Error('Chroma delete error'));

      const result = await chromaService.deleteVectorsByDocument('doc_to_delete');

      expect(result).toEqual({ success: false, documentId: 'doc_to_delete' });
    });
  });
});
