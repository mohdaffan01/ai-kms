import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { extractTextFromPdf, processDocument } from '../../../src/services/documentProcessor.js';
import * as embeddingService from '../../../src/services/embeddingService.js';
import * as chromaService from '../../../src/services/chromaService.js';

describe('Service: documentProcessor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractTextFromPdf', () => {
    it('should throw an error if the file does not exist on disk', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      await expect(extractTextFromPdf('non_existent_file.pdf')).rejects.toThrow(
        'File not found at path'
      );
    });
  });

  describe('processDocument', () => {
    it('should orchestrate text extraction, cleaning, chunking, and ChromaDB indexing for text file', async () => {
      const mockRawContent = 'Operating Systems manage CPU scheduling, memory allocation, and disk storage. '.repeat(10);

      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockRawContent);
      vi.spyOn(embeddingService, 'generateBatchEmbeddings').mockImplementation(async (chunks) => {
        return chunks.map((c) => ({ ...c, embedding: new Array(768).fill(0.5) }));
      });
      vi.spyOn(chromaService, 'upsertVectors').mockResolvedValue({ success: true, count: 2 });

      const result = await processDocument('dummy-notes.txt', 'text/plain', 'doc_123', 'user_456');

      expect(result.success).toBe(true);
      expect(result.documentId).toBe('doc_123');
      expect(result.vectorized).toBe(true);
      expect(result.totalChunks).toBeGreaterThan(0);
      expect(result.totalCharacters).toBeGreaterThan(0);
      expect(chromaService.upsertVectors).toHaveBeenCalled();
    });

    it('should throw an error if extracted text is empty or unreadable', async () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValue('    ');

      await expect(
        processDocument('empty.txt', 'text/plain', 'doc_empty', 'user_1')
      ).rejects.toThrow('Extracted text is empty or unreadable');
    });

    it('should gracefully handle vector embedding failure and still return extracted summary', async () => {
      const mockContent = 'Data Structures and Algorithms notes covering Trees and Graphs.';

      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);
      vi.spyOn(embeddingService, 'generateBatchEmbeddings').mockRejectedValue(
        new Error('Ollama offline')
      );

      const result = await processDocument('dsa.txt', 'text/plain', 'doc_dsa', 'user_1');

      expect(result.success).toBe(true);
      expect(result.vectorized).toBe(false); // Graceful fallback
      expect(result.totalChunks).toBeGreaterThan(0);
    });
  });
});
