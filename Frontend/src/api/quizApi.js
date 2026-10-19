import authApi from './authApi';

/**
 * Fetch user's quizzes and overall performance stats with optional subject filter
 */
export const getQuizzesApi = async (params = {}) => {
  const response = await authApi.get('/quizzes', { params });
  return response.data;
};

/**
 * Fetch a single quiz by ID with all questions and past attempts
 */
export const getQuizByIdApi = async (id) => {
  const response = await authApi.get(`/quizzes/${id}`);
  return response.data;
};

/**
 * Generate a new assessment quiz using AI grounded in completed topics and notes
 * @param {Object} data - { subject, topic, count, difficulty }
 */
export const generateQuizApi = async ({ subject, topic, count = 5, difficulty = 'mixed' }) => {
  const response = await authApi.post('/quizzes/generate', {
    subject,
    topic,
    count,
    difficulty,
  });
  return response.data;
};

/**
 * Submit answers for an active quiz attempt
 * @param {string} id - Quiz ID
 * @param {Object} payload - { answers: [{ questionIndex, selectedOption }], timeSpentSeconds }
 */
export const submitQuizResultApi = async (id, payload) => {
  const response = await authApi.post(`/quizzes/${id}/submit`, payload);
  return response.data;
};

/**
 * Delete a quiz
 * @param {string} id - Quiz ID
 */
export const deleteQuizApi = async (id) => {
  const response = await authApi.delete(`/quizzes/${id}`);
  return response.data;
};
