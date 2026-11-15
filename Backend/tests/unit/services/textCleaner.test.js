import { describe, it, expect } from 'vitest';
import { cleanText } from '../../../src/services/textCleaner.js';

describe('Service: textCleaner', () => {
  it('should return an empty string for null, undefined, or non-string inputs', () => {
    expect(cleanText(null)).toBe('');
    expect(cleanText(undefined)).toBe('');
    expect(cleanText(12345)).toBe('');
    expect(cleanText({})).toBe('');
    expect(cleanText([])).toBe('');
  });

  it('should remove null bytes and non-printable control characters', () => {
    const dirtyText = 'Hello\x00World\x08This\x1FIsClean';
    expect(cleanText(dirtyText)).toBe('HelloWorldThisIsClean');
  });

  it('should normalize Windows (\\r\\n) and Mac (\\r) line breaks to standard \\n', () => {
    const winText = 'Line 1\r\nLine 2\rLine 3';
    expect(cleanText(winText)).toBe('Line 1\nLine 2\nLine 3');
  });

  it('should strip PDF page numbering headers and footers', () => {
    const textWithPageHeaders = 'Some intro text.\nPage 1 of 12\nSome more text.\n-- 2 --\nEnding text.';
    const cleaned = cleanText(textWithPageHeaders);
    expect(cleaned).not.toContain('Page 1 of 12');
    expect(cleaned).not.toContain('-- 2 --');
    expect(cleaned).toContain('Some intro text.');
    expect(cleaned).toContain('Ending text.');
  });

  it('should collapse multiple horizontal spaces and tabs into a single space', () => {
    const spaceyText = 'Too    many   spaces\tand\t\ttabs   here.';
    expect(cleanText(spaceyText)).toBe('Too many spaces and tabs here.');
  });

  it('should collapse 3 or more consecutive newlines into double newlines for paragraph consistency', () => {
    const newlineText = 'Paragraph 1\n\n\n\n\nParagraph 2';
    expect(cleanText(newlineText)).toBe('Paragraph 1\n\nParagraph 2');
  });

  it('should trim leading and trailing whitespace on each line and overall', () => {
    const untrimmed = '   Line with spaces   \n   Second line with spaces   ';
    expect(cleanText(untrimmed)).toBe('Line with spaces\nSecond line with spaces');
  });
});
