import authApi from './authApi';

/**
 * Fetch user's flashcards with optional filters (subject, topic, filter, search)
 */
export const getFlashcardsApi = async (params = {}) => {
  const response = await authApi.get('/flashcards', { params });
  return response.data;
};

/**
 * Generate flashcards using AI from completed topics or specific topic
 * @param {Object} data - { subject, topic, count }
 */
export const generateFlashcardsApi = async ({ subject, topic, count = 5 }) => {
  const response = await authApi.post('/flashcards/generate', {
    subject,
    topic,
    count,
  });
  return response.data;
};

/**
 * Manually create a new custom flashcard
 * @param {Object} cardData - { subject, topic, front, back, hint, difficulty }
 */
export const createFlashcardApi = async (cardData) => {
  const response = await authApi.post('/flashcards', cardData);
  return response.data;
};

/**
 * Toggle mastery status of a flashcard
 * @param {string} id - Flashcard ID
 * @param {boolean} [isMastered] - Optional target state
 */
export const toggleFlashcardMasteredApi = async (id, isMastered) => {
  const response = await authApi.patch(`/flashcards/${id}/master`, { isMastered });
  return response.data;
};

/**
 * Delete a flashcard
 * @param {string} id - Flashcard ID
 */
export const deleteFlashcardApi = async (id) => {
  const response = await authApi.delete(`/flashcards/${id}`);
  return response.data;
};

/**
 * Reset mastery for a subject deck so user can practice fresh
 * @param {string} subject - Subject name or 'all'
 */
export const resetDeckMasteryApi = async (subject) => {
  const response = await authApi.post('/flashcards/reset-mastery', { subject });
  return response.data;
};
