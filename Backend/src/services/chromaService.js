/**
 * Service: ChromaDB Service
 * Handles ChromaDB vector database interactions, collection initialization,
 * metadata payload storage, user-isolated vector search, and vector deletion.
 * Gracefully handles offline server state.
 */

import { ChromaClient } from 'chromadb';

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const COLLECTION_NAME = process.env.CHROMA_COLLECTION || 'knowledge_chunks';

let clientInstance = null;

const parseChromaUrl = (urlStr) => {
  try {
    const url = new URL(urlStr);
    return {
      host: url.hostname || 'localhost',
      port: parseInt(url.port || (url.protocol === 'https:' ? '443' : '8000'), 10),
      ssl: url.protocol === 'https:',
    };
  } catch {
    return { host: 'localhost', port: 8000, ssl: false };
  }
};

const getClient = () => {
  if (!clientInstance) {
    const config = parseChromaUrl(CHROMA_URL);
    clientInstance = new ChromaClient(config);
  }
  return clientInstance;
};

// Dummy embedding function so ChromaDB JS client does not throw DefaultEmbeddingFunction error
const nullEmbeddingFunction = {
  generate: async (texts) => texts.map(() => []),
};

/**
 * Get or create ChromaDB collection with Cosine distance metric.
 */
export const getChromaCollection = async () => {
  try {
    const client = getClient();
    const collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { 'hnsw:space': 'cosine' },
      embeddingFunction: nullEmbeddingFunction,
    });
    return collection;
  } catch (error) {
    throw new Error(`ChromaDB server offline on ${CHROMA_URL}`);
  }
};

/**
 * Upsert vector points into ChromaDB collection with metadata payloads and text documents.
 * 
 * @param {Array<{ id: string, vector: Array<number>, payload: Object }>} points - Vector points
 */
export const upsertVectors = async (points) => {
  if (!Array.isArray(points) || points.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const collection = await getChromaCollection();

    const ids = [];
    const embeddings = [];
    const metadatas = [];
    const documents = [];

    points.forEach((pt) => {
      ids.push(pt.id.toString());
      embeddings.push(pt.vector);
      documents.push(pt.payload.text || '');

      metadatas.push({
        userId: (pt.payload.userId || '').toString(),
        documentId: (pt.payload.documentId || '').toString(),
        chunkIndex: typeof pt.payload.chunkIndex === 'number' ? pt.payload.chunkIndex : 0,
        charCount: typeof pt.payload.charCount === 'number' ? pt.payload.charCount : 0,
        createdAt: pt.payload.createdAt || new Date().toISOString(),
      });
    });

    await collection.upsert({
      ids,
      embeddings,
      metadatas,
      documents,
    });

    console.log(`[ChromaService] Successfully upserted ${ids.length} chunks into ChromaDB collection '${COLLECTION_NAME}'`);
    return { success: true, count: ids.length };
  } catch (error) {
    console.warn(`[ChromaService] Upsert skipped (ChromaDB offline on ${CHROMA_URL})`);
    return { success: false, count: 0 };
  }
};

/**
 * Search vectors in ChromaDB with user isolation filter.
 * 
 * @param {string} userId - Authenticated User ID from JWT
 * @param {Array<number>} queryVector - Vector representation of search query
 * @param {number} [limit=5] - Number of top relevant matches to return
 * @returns {Promise<Array<Object>>} Matching chunks with payloads and scores
 */
export const searchVectors = async (userId, queryVector, limit = 5) => {
  try {
    const collection = await getChromaCollection();

    const queryResults = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: limit,
      where: { userId: userId.toString() },
    });

    const matches = [];

    if (queryResults && queryResults.ids && queryResults.ids[0]) {
      const ids = queryResults.ids[0];
      const distances = queryResults.distances ? queryResults.distances[0] : [];
      const metadatas = queryResults.metadatas ? queryResults.metadatas[0] : [];
      const documents = queryResults.documents ? queryResults.documents[0] : [];

      for (let i = 0; i < ids.length; i++) {
        const dist = distances[i] !== undefined ? distances[i] : 1;
        const score = Math.max(0, 1 - dist);

        const meta = metadatas[i] || {};
        const text = documents[i] || '';

        matches.push({
          id: ids[i],
          score,
          payload: {
            userId: meta.userId,
            documentId: meta.documentId,
            chunkIndex: meta.chunkIndex,
            charCount: meta.charCount,
            createdAt: meta.createdAt,
            text,
          },
        });
      }
    }

    return matches;
  } catch (error) {
    console.warn(`[ChromaService] Vector search skipped (ChromaDB offline on ${CHROMA_URL})`);
    return [];
  }
};

/**
 * Delete all vector points associated with a specific document from ChromaDB.
 * 
 * @param {string} documentId - Document ID to delete vectors for
 */
export const deleteVectorsByDocument = async (documentId) => {
  try {
    const collection = await getChromaCollection();

    await collection.delete({
      where: { documentId: documentId.toString() },
    });

    console.log(`[ChromaService] Successfully deleted vectors for documentId: ${documentId}`);
    return { success: true, documentId };
  } catch (error) {
    console.warn(`[ChromaService] Delete vectors skipped (ChromaDB offline on ${CHROMA_URL})`);
    return { success: false, documentId };
  }
};

export default {
  getChromaCollection,
  upsertVectors,
  searchVectors,
  deleteVectorsByDocument,
};
