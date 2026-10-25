import authApi from './authApi';

/**
 * Upload a document (PDF, PPT, DOC, TXT, MD) to the backend
 * @param {FormData} formData - Multipart form-data containing 'file', 'title', 'subject', etc.
 */
export const uploadDocumentApi = async (formData) => {
  const response = await authApi.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Fetch documents uploaded by the authenticated user
 * @param {Object} params - Optional filters like subject, topic, folder
 */
export const getMyDocumentsApi = async (params = {}) => {
  const response = await authApi.get('/documents/my-documents', { params });
  return response.data;
};

/**
 * Delete a document by its ID
 * @param {string} id - Document MongoDB ID
 */
export const deleteDocumentApi = async (id) => {
  const response = await authApi.delete(`/documents/${id}`);
  return response.data;
};

/**
 * Fetch calculated statistics (pageCount, wordCount, lineCount) for a document
 * @param {string} id - Document MongoDB ID
 */
export const getDocumentStatsApi = async (id) => {
  const response = await authApi.get(`/documents/${id}/stats`);
  return response.data;
};
