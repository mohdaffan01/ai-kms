import authApi from './authApi';

/**
 * Fetch full dashboard data including stats, subjects, topics, recent activities, and documents
 */
export const getDashboardDataApi = async () => {
  const response = await authApi.get('/progress/dashboard');
  return response.data;
};

/**
 * Toggle topic completion status
 * @param {string} subjectId - Subject ID
 * @param {string} topicId - Topic ID
 * @param {boolean} [completed] - Optional explicit boolean state
 */
export const toggleTopicApi = async (subjectId, topicId, completed) => {
  const response = await authApi.put('/progress/toggle-topic', {
    subjectId,
    topicId,
    completed,
  });
  return response.data;
};

/**
 * Create a new subject with optional custom topics
 * @param {Object} subjectData - { name, code, description, category, topics, color, icon }
 */
export const createSubjectApi = async (subjectData) => {
  const response = await authApi.post('/progress/subject', subjectData);
  return response.data;
};

/**
 * Delete a subject
 * @param {string} subjectId - Subject ID
 */
export const deleteSubjectApi = async (subjectId) => {
  const response = await authApi.delete(`/progress/subject/${subjectId}`);
  return response.data;
};

/**
 * Add a new topic to an existing subject
 * @param {string} subjectId - Subject ID
 * @param {string} name - Topic name
 */
export const addTopicApi = async (subjectId, name) => {
  const response = await authApi.post(`/progress/subject/${subjectId}/topic`, { name });
  return response.data;
};

/**
 * Reset curriculum to the default 5 CS subjects
 */
export const resetDefaultSubjectsApi = async () => {
  const response = await authApi.post('/progress/reset-defaults');
  return response.data;
};
