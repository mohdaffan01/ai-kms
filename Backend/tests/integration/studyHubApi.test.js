import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { progressRepository } from '../../src/repositories/progress.repository.js';
import { flashcardRepository } from '../../src/repositories/flashcard.repository.js';
import { quizRepository } from '../../src/repositories/quiz.repository.js';
import { documentRepository } from '../../src/repositories/document.repository.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import generateToken from '../../src/utils/generateToken.js';
import { mockUser, mockDocument } from '../fixtures/sampleData.js';

describe('Integration: Study Hub API (Progress, Flashcards, Quizzes)', () => {
  let authToken;

  beforeEach(() => {
    vi.restoreAllMocks();
    authToken = generateToken(mockUser._id);
    vi.spyOn(userRepository, 'findByIdWithoutPassword').mockResolvedValue(mockUser);
  });

  describe('Progress API', () => {
    it('GET /api/progress/dashboard should return dashboard statistics and curriculum', async () => {
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

      const response = await request(app)
        .get('/api/progress/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('overallProgress');
      expect(response.body.subjects).toHaveLength(1);
    });

    it('PUT /api/progress/toggle-topic should toggle topic completion status', async () => {
      const mockProgress = {
        userId: mockUser._id,
        subjects: [
          {
            id: 'sub_os',
            name: 'Operating Systems',
            topics: [
              { id: 'top_1', name: 'Processes', completed: false, subtopics: [] },
            ],
          },
        ],
        recentActivities: [],
        markModified: vi.fn(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(progressRepository, 'findByUserId').mockResolvedValue(mockProgress);
      vi.spyOn(documentRepository, 'find').mockResolvedValue([mockDocument]);

      const response = await request(app)
        .put('/api/progress/toggle-topic')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subjectId: 'sub_os',
          topicId: 'top_1',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Status updated');
      expect(mockProgress.subjects[0].topics[0].completed).toBe(true);
    });
  });

  describe('Flashcards API', () => {
    it('GET /api/flashcards should return user flashcard deck and stats', async () => {
      const mockCard = {
        _id: 'card_1',
        userId: mockUser._id,
        subject: 'Operating Systems',
        topic: 'Deadlocks',
        front: 'What is a deadlock?',
        back: 'A deadlock is a situation where processes block waiting for resources.',
        isMastered: false,
        reviewCount: 2,
      };

      const mockQueryChain = {
        sort: vi.fn().mockResolvedValue([mockCard]),
      };
      vi.spyOn(flashcardRepository, 'find').mockReturnValue(mockQueryChain);
      vi.spyOn(flashcardRepository, 'findAllByUser').mockResolvedValue([mockCard]);

      const response = await request(app)
        .get('/api/flashcards')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].front).toBe('What is a deadlock?');
    });

    it('PATCH /api/flashcards/:id/master should toggle flashcard mastery status', async () => {
      const mockCardInstance = {
        _id: 'card_1',
        isMastered: false,
        reviewCount: 0,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(flashcardRepository, 'findByIdAndUser').mockResolvedValue(mockCardInstance);

      const response = await request(app)
        .patch('/api/flashcards/card_1/master')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isMastered: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Marked as mastered!');
      expect(mockCardInstance.isMastered).toBe(true);
      expect(mockCardInstance.reviewCount).toBe(1);
    });
  });

  describe('Quizzes API', () => {
    it('GET /api/quizzes/:id should return single quiz details', async () => {
      const mockQuiz = {
        _id: 'quiz_1',
        userId: mockUser._id,
        title: 'OS Quiz 1',
        subject: 'Operating Systems',
        questions: [
          { question: 'What is CPU scheduling?', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 },
        ],
        totalQuestions: 1,
      };

      vi.spyOn(quizRepository, 'findByIdAndUser').mockResolvedValue(mockQuiz);

      const response = await request(app)
        .get('/api/quizzes/quiz_1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('OS Quiz 1');
    });

    it('POST /api/quizzes/:id/submit should calculate percentage and record quiz attempt', async () => {
      const mockQuizInstance = {
        _id: 'quiz_1',
        title: 'OS Quiz 1',
        subject: 'Operating Systems',
        totalQuestions: 1,
        questions: [
          { question: 'What is CPU scheduling?', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 },
        ],
        attempts: [],
        bestScore: 0,
        bestPercentage: 0,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(quizRepository, 'findByIdAndUser').mockResolvedValue(mockQuizInstance);
      vi.spyOn(progressRepository, 'addRecentActivity').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/quizzes/quiz_1/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [{ questionIndex: 0, selectedOption: 0 }],
          timeSpentSeconds: 30,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.score).toBe(1);
      expect(response.body.data.percentage).toBe(100);
    });
  });
});
