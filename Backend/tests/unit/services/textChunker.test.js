import { describe, it, expect } from 'vitest';
import { chunkText } from '../../../src/services/textChunker.js';

describe('Service: textChunker', () => {
  it('should return an empty array for empty, null, or non-string inputs', () => {
    expect(chunkText(null)).toEqual([]);
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   ')).toEqual([]);
    expect(chunkText(12345)).toEqual([]);
  });

  it('should return a single chunk if text length is less than or equal to chunkSize', () => {
    const shortText = 'Operating Systems manage computer hardware and software resources.';
    const result = chunkText(shortText, { chunkSize: 800, chunkOverlap: 100 });

    expect(result).toHaveLength(1);
    expect(result[0].chunkIndex).toBe(0);
    expect(result[0].text).toBe(shortText);
    expect(result[0].charCount).toBe(shortText.length);
  });

  it('should split long text into multiple sequential chunks with proper indices', () => {
    const sentence = 'A process is an instance of a program in execution. It contains program code and its activity. ';
    const longText = sentence.repeat(25); // ~2400 chars

    const chunks = chunkText(longText, { chunkSize: 500, chunkOverlap: 100 });

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk, index) => {
      expect(chunk.chunkIndex).toBe(index);
      expect(chunk.text.length).toBeGreaterThan(0);
      expect(chunk.charCount).toBe(chunk.text.length);
    });
  });

  it('should preserve context through chunk overlap between consecutive chunks', () => {
    const p1 = 'First section introduces CPU architecture and register management.';
    const p2 = ' Second section focuses on paging, segmentation, and virtual memory systems.';
    const text = (p1 + p2).repeat(10);

    const chunks = chunkText(text, { chunkSize: 300, chunkOverlap: 60 });

    expect(chunks.length).toBeGreaterThan(1);
    // There should be common text content between chunk 0 end and chunk 1 start
    const chunk0Ending = chunks[0].text.slice(-30);
    expect(chunks[1].text).toContain(chunk0Ending.slice(0, 15));
  });

  it('should prefer natural sentence boundaries over cutting words in half', () => {
    const text = 'First complete sentence. Second complete sentence. Third complete sentence. Fourth complete sentence.';
    const chunks = chunkText(text, { chunkSize: 55, chunkOverlap: 10 });

    expect(chunks.length).toBeGreaterThan(1);
    // Chunks should end at sentence or period boundary where possible
    expect(chunks[0].text.endsWith('.')).toBe(true);
  });
});
