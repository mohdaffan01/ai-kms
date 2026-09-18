/**
 * Service: Text Chunker
 * Splits cleaned document text into overlapping chunks suitable for vector embeddings.
 */

/**
 * Split text into semantic chunks with specified size and overlap.
 * 
 * @param {string} text - Cleaned document text
 * @param {Object} options - Chunking configuration options
 * @param {number} [options.chunkSize=800] - Target chunk size in characters/tokens (500-1000)
 * @param {number} [options.chunkOverlap=100] - Overlap size between chunks (50-150)
 * @returns {Array<{ chunkIndex: number, text: string, charCount: number }>} Array of text chunk objects
 */
export const chunkText = (text, options = {}) => {
  const chunkSize = options.chunkSize || 800;
  const chunkOverlap = options.chunkOverlap || 100;

  if (!text || typeof text !== 'string') {
    return [];
  }

  const trimmedText = text.trim();
  if (!trimmedText) {
    return [];
  }

  // If total length is smaller than target chunkSize, return as single chunk
  if (trimmedText.length <= chunkSize) {
    return [
      {
        chunkIndex: 0,
        text: trimmedText,
        charCount: trimmedText.length,
      },
    ];
  }

  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < trimmedText.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex >= trimmedText.length) {
      endIndex = trimmedText.length;
    } else {
      // Try to break at paragraph boundary, sentence boundary, or whitespace
      const sentenceBoundary = trimmedText.lastIndexOf('. ', endIndex);
      const newlineBoundary = trimmedText.lastIndexOf('\n', endIndex);

      if (newlineBoundary > startIndex + chunkSize / 2) {
        endIndex = newlineBoundary + 1;
      } else if (sentenceBoundary > startIndex + chunkSize / 2) {
        endIndex = sentenceBoundary + 1;
      } else {
        const spaceBoundary = trimmedText.lastIndexOf(' ', endIndex);
        if (spaceBoundary > startIndex + chunkSize / 2) {
          endIndex = spaceBoundary + 1;
        }
      }
    }

    const chunkContent = trimmedText.substring(startIndex, endIndex).trim();

    if (chunkContent.length > 0) {
      chunks.push({
        chunkIndex,
        text: chunkContent,
        charCount: chunkContent.length,
      });
      chunkIndex++;
    }

    if (endIndex >= trimmedText.length) {
      break;
    }

    // Step forward by chunkSize minus overlap
    const step = chunkSize - chunkOverlap;
    startIndex = Math.max(startIndex + 1, endIndex - chunkOverlap);
  }

  return chunks;
};

export default {
  chunkText,
};
