import authApi from './authApi';

/**
 * Send a question to RAG Chat endpoint to answer using uploaded PDF/document content
 * @param {string} message - User query text
 * @param {string} [documentId] - Optional specific document ID to target (or 'all' / null)
 * @param {string} [subject] - Optional subject name to scope knowledge query
 */
export const queryKnowledgeChatApi = async (message, documentId = null, subject = null) => {
  const payload = { message };
  if (documentId && documentId !== 'all') {
    payload.documentId = documentId;
  }
  if (subject && subject !== 'all') {
    payload.subject = subject;
  }
  const response = await authApi.post('/knowledge/chat', payload);
  return response.data;
};

/**
 * Trigger text extraction, chunking, and vector embedding for a specific document
 * @param {string} documentId - Document MongoDB ID
 */
export const processDocumentKnowledgeApi = async (documentId) => {
  const response = await authApi.post(`/knowledge/process/${documentId}`);
  return response.data;
};

/**
 * Search user's document vector index directly
 * @param {string} query - Search query
 * @param {number} [limit=5] - Result limit
 */
export const searchKnowledgeApi = async (query, limit = 5) => {
  const response = await authApi.post('/knowledge/search', { query, limit });
  return response.data;
};
