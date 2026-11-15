import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEmbedding, generateBatchEmbeddings } from '../../../src/services/embeddingService.js';
import { mockChunks } from '../../fixtures/sampleData.js';

describe('Service: embeddingService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should return a 768-dimensional vector from Ollama API on success', async () => {
      const mockVector = new Array(768).fill(0.42);

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ embedding: mockVector }),
      });

      const vector = await generateEmbedding('Explain virtual memory');

      expect(vector).toHaveLength(768);
      expect(vector[0]).toBe(0.42);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/embeddings'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'nomic-embed-text',
            prompt: 'Explain virtual memory',
          }),
        })
      );
    });

    it('should gracefully return 768 zeros if text is empty or null without calling Ollama', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const nullVector = await generateEmbedding(null);
      const emptyVector = await generateEmbedding('');

      expect(nullVector).toHaveLength(768);
      expect(nullVector.every((val) => val === 0)).toBe(true);
      expect(emptyVector).toHaveLength(768);
      expect(emptyVector.every((val) => val === 0)).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should gracefully return 768 zero fallback vector if Ollama is offline or returns error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:11434'));

      const vector = await generateEmbedding('Some text when Ollama is down');

      expect(vector).toHaveLength(768);
      expect(vector.every((val) => val === 0)).toBe(true);
    });

    it('should return fallback zero vector if Ollama returns non-200 status', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const vector = await generateEmbedding('Text triggering model failure');

      expect(vector).toHaveLength(768);
      expect(vector.every((val) => val === 0)).toBe(true);
    });
  });

  describe('generateBatchEmbeddings', () => {
    it('should process an array of chunks and attach embedding vectors to each item', async () => {
      const mockVector = new Array(768).fill(0.99);

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ embedding: mockVector }),
      });

      const results = await generateBatchEmbeddings(mockChunks);

      expect(results).toHaveLength(mockChunks.length);
      results.forEach((chunk, index) => {
        expect(chunk.chunkIndex).toBe(mockChunks[index].chunkIndex);
        expect(chunk.text).toBe(mockChunks[index].text);
        expect(chunk.embedding).toHaveLength(768);
        expect(chunk.embedding[0]).toBe(0.99);
      });
    });

    it('should return an empty array if chunks input is not an array', async () => {
      expect(await generateBatchEmbeddings(null)).toEqual([]);
      expect(await generateBatchEmbeddings(undefined)).toEqual([]);
      expect(await generateBatchEmbeddings('not an array')).toEqual([]);
    });
  });
});
