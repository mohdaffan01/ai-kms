/**
 * Service: Embedding Service
 * Generates vector embeddings for text chunks using local Ollama model endpoint.
 * Gracefully handles offline state with zero-vector fallback.
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
const VECTOR_SIZE = 768;

/**
 * Generate a vector embedding for a single text string using Ollama API.
 * 
 * @param {string} text - Text to convert to embedding
 * @returns {Promise<Array<number>>} Vector embedding array
 */
export const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string') {
    return new Array(VECTOR_SIZE).fill(0);
  }

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        prompt: text,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[EmbeddingService] Ollama API response non-200 (${response.status}): ${errText}`);
      return new Array(VECTOR_SIZE).fill(0);
    }

    const data = await response.json();
    if (!data.embedding || !Array.isArray(data.embedding)) {
      console.warn('[EmbeddingService] Invalid embedding response format from Ollama');
      return new Array(VECTOR_SIZE).fill(0);
    }

    return data.embedding;
  } catch (error) {
    console.warn(`[EmbeddingService] Ollama offline or unreachable (${error.message}). Using fallback vector.`);
    return new Array(VECTOR_SIZE).fill(0);
  }
};

/**
 * Generate vector embeddings for a batch of text chunks.
 * 
 * @param {Array<{ chunkIndex: number, text: string }>} chunks - Array of text chunk objects
 * @returns {Promise<Array<{ chunkIndex: number, text: string, embedding: Array<number> }>>} Chunks with vector embeddings
 */
export const generateBatchEmbeddings = async (chunks) => {
  if (!Array.isArray(chunks)) {
    return [];
  }

  const embeddedChunks = [];

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.text);
    embeddedChunks.push({
      ...chunk,
      embedding,
    });
  }

  return embeddedChunks;
};

export default {
  generateEmbedding,
  generateBatchEmbeddings,
};
