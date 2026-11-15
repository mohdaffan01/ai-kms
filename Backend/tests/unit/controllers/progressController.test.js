import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDashboardData,
  toggleTopic,
  DEFAULT_CS_SUBJECTS,
} from '../../../src/controllers/progress.controller.js';
import { progressRepository } from '../../../src/repositories/progress.repository.js';
import { documentRepository } from '../../../src/repositories/document.repository.js';
import { mockUser, mockDocument } from '../../fixtures/sampleData.js';

describe('Controller: progressController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, user: { _id: mockUser._id }, params: {}, query: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('DEFAULT_CS_SUBJECTS', () => {
    it('should be an empty array as subjects are dynamically created from uploaded materials', () => {
      expect(Array.isArray(DEFAULT_CS_SUBJECTS)).toBe(true);
      expect(DEFAULT_CS_SUBJECTS).toHaveLength(0);
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard stats, subjects, and recent activity', async () => {
      const mockProgress = {
        userId: mockUser._id,
        subjects: [
          {
            id: 'sub_os',
            name: 'Operating Systems',
            topics: [
              { id: 'top_1', name: 'Processes', completed: true, isExtracted: true, subtopics: [] },
              { id: 'top_2', name: 'Threads', completed: false, isExtracted: true, subtopics: [] },
            ],
          },
        ],
        recentActivities: [],
        markModified: vi.fn(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(progressRepository, 'findByUserId').mockResolvedValue(mockProgress);
      vi.spyOn(documentRepository, 'findUserDocuments').mockResolvedValue([mockDocument]);

      await getDashboardData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          stats: expect.objectContaining({
            totalSubjects: 1,
            totalTopics: 2,
            completedTopics: 1,
            overallProgress: 50,
            uploadedDocuments: 1,
          }),
        })
      );
    });
  });

  describe('toggleTopic', () => {
    it('should return 400 if subjectId or topicId is missing in body', async () => {
      req.body = { subjectId: 'sub_1' }; // missing topicId

      await toggleTopic(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'subjectId and topicId are required.' })
      );
    });

    it('should toggle topic completion and update user progress', async () => {
      req.body = { subjectId: 'sub_os', topicId: 'top_threads' };

      const mockProgress = {
        userId: mockUser._id,
        subjects: [
          {
            id: 'sub_os',
            name: 'Operating Systems',
            topics: [
              {
                id: 'top_threads',
                name: 'Threads',
                completed: false,
                subtopics: [],
              },
            ],
          },
        ],
        recentActivities: [],
        markModified: vi.fn(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(progressRepository, 'findByUserId').mockResolvedValue(mockProgress);
      vi.spyOn(documentRepository, 'find').mockResolvedValue([mockDocument]);

      await toggleTopic(req, res);

      expect(mockProgress.subjects[0].topics[0].completed).toBe(true);
      expect(mockProgress.markModified).toHaveBeenCalledWith('subjects');
      expect(mockProgress.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Status updated',
        })
      );
    });
  });
});
