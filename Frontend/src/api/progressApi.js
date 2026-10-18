import authApi from './authApi';

/**
 * Fetch full dashboard data including stats, subjects, topics, recent activities, and documents
 */
export const getDashboardDataApi = async () => {
  const response = await authApi.get('/progress/dashboard');
  return response.data;
};

/**
 * Toggle topic or subtopic completion status
 * @param {string} subjectId - Subject ID
 * @param {string} topicId - Topic ID
 * @param {string|boolean} [subtopicId] - Optional subtopic ID or boolean completed
 * @param {boolean} [completed] - Optional explicit boolean state
 */
export const toggleTopicApi = async (subjectId, topicId, subtopicId, completed) => {
  let actualSubtopicId = null;
  let actualCompleted = completed;

  if (typeof subtopicId === 'boolean') {
    actualCompleted = subtopicId;
  } else if (subtopicId) {
    actualSubtopicId = subtopicId;
  }

  const response = await authApi.put('/progress/toggle-topic', {
    subjectId,
    topicId,
    subtopicId: actualSubtopicId,
    completed: actualCompleted,
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
 * Add a new topic or child subtopic to an existing subject
 * @param {string} subjectId - Subject ID
 * @param {string} name - Topic or Subtopic name
 * @param {string} [parentTopicId] - Optional parent topic ID to add subtopic under
 */
export const addTopicApi = async (subjectId, name, parentTopicId) => {
  const response = await authApi.post(`/progress/subject/${subjectId}/topic`, { name, parentTopicId });
  return response.data;
};

/**
 * Reset curriculum to the default 5 CS subjects
 */
export const resetDefaultSubjectsApi = async () => {
  const response = await authApi.post('/progress/reset-defaults');
  return response.data;
};
