/**
 * Service: Text Cleaner
 * Clean extracted text from documents before chunking and embedding generation.
 */

/**
 * Clean and normalize raw extracted text.
 * - Removes extra spaces and tabs
 * - Normalizes multiple line breaks to maximum double newlines
 * - Strips page numbers, headers, and footer patterns
 * - Trims leading/trailing whitespace
 * 
 * @param {string} rawText - Raw text extracted from document
 * @returns {string} Cleaned text
 */
export const cleanText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  let text = rawText;

  // Replace null bytes and non-printable control characters (except tabs and newlines)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize Windows/Mac line endings to \n
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Strip common PDF page number headers/footers (e.g. "Page 1 of 10", "Page 1", "-- 1 --")
  text = text.replace(/(?:Page\s+\d+(?:\s+of\s+\d+)?|^\s*--?\s*\d+\s*--?\s*$)/gim, '');

  // Replace multiple horizontal spaces and tabs with a single space
  text = text.replace(/[ \t]+/g, ' ');

  // Collapse consecutive newlines (more than 2) into double newlines for paragraph separation
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');

  // Trim whitespace per line
  text = text
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  return text.trim();
};

export default {
  cleanText,
};
