/**
 * Service: Embedding Service
 * Generates vector embeddings for text chunks using local Ollama model endpoint.
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';

/**
 * Generate a vector embedding for a single text string using Ollama API.
 * 
 * @param {string} text - Text to convert to embedding
 * @returns {Promise<Array<number>>} Vector embedding array
 */
export const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Valid text string is required for embedding generation');
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
      throw new Error(`Ollama API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response format from Ollama');
    }

    return data.embedding;
  } catch (error) {
    console.error(`[EmbeddingService] Failed to generate embedding:`, error.message);
    throw error;
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
    throw new Error('Chunks must be an array');
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
