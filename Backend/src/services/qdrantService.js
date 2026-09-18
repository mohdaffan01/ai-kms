/**
 * Service: Qdrant Service
 * Handles Qdrant vector database interactions, collection initialization,
 * metadata payload storage, user-isolated vector search, and vector deletion.
 */

const QDRANT_HOST = process.env.QDRANT_HOST || 'http://localhost:6333';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'knowledge_chunks';
const VECTOR_SIZE = parseInt(process.env.VECTOR_SIZE || '768', 10);

/**
 * Ensure Qdrant collection exists. Creates it if not present.
 */
export const ensureCollectionExists = async () => {
  try {
    const res = await fetch(`${QDRANT_HOST}/collections/${COLLECTION_NAME}`);
    if (res.ok) {
      return true; // Collection already exists
    }

    // Create collection with Cosine distance metric
    const createRes = await fetch(`${QDRANT_HOST}/collections/${COLLECTION_NAME}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create Qdrant collection: ${errText}`);
    }

    console.log(`[QdrantService] Collection '${COLLECTION_NAME}' created successfully.`);
    return true;
  } catch (error) {
    console.error(`[QdrantService] Collection setup error:`, error.message);
    throw error;
  }
};

/**
 * Upsert vector points into Qdrant collection with metadata payloads.
 * 
 * @param {Array<{ id: string, vector: Array<number>, payload: Object }>} points - Vector points to insert
 */
export const upsertVectors = async (points) => {
  await ensureCollectionExists();

  try {
    const response = await fetch(`${QDRANT_HOST}/collections/${COLLECTION_NAME}/points`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Qdrant upsert failed (${response.status}): ${errText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[QdrantService] Upsert error:`, error.message);
    throw error;
  }
};

/**
 * Search vectors in Qdrant with user isolation filter.
 * 
 * @param {string} userId - Authenticated User ID from JWT
 * @param {Array<number>} queryVector - Vector representation of search query
 * @param {number} [limit=5] - Number of top relevant matches to return
 * @returns {Promise<Array<Object>>} Matching chunks with payloads and scores
 */
export const searchVectors = async (userId, queryVector, limit = 5) => {
  await ensureCollectionExists();

  try {
    const response = await fetch(`${QDRANT_HOST}/collections/${COLLECTION_NAME}/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector: queryVector,
        limit,
        with_payload: true,
        filter: {
          must: [
            {
              key: 'userId',
              match: { value: userId.toString() },
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Qdrant search failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error(`[QdrantService] Search error:`, error.message);
    throw error;
  }
};

/**
 * Delete all vector points associated with a specific document.
 * 
 * @param {string} documentId - Document ID to delete vectors for
 */
export const deleteVectorsByDocument = async (documentId) => {
  try {
    const response = await fetch(`${QDRANT_HOST}/collections/${COLLECTION_NAME}/points/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter: {
          must: [
            {
              key: 'documentId',
              match: { value: documentId.toString() },
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Qdrant deletion failed (${response.status}): ${errText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[QdrantService] Delete document vectors error:`, error.message);
    throw error;
  }
};

export default {
  ensureCollectionExists,
  upsertVectors,
  searchVectors,
  deleteVectorsByDocument,
};
