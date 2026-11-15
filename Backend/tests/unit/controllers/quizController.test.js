import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitQuizResult } from '../../../src/controllers/quiz.controller.js';
import { quizRepository } from '../../../src/repositories/quiz.repository.js';
import { progressRepository } from '../../../src/repositories/progress.repository.js';
import { mockUser } from '../../fixtures/sampleData.js';

describe('Controller: quizController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, user: { _id: mockUser._id }, params: {}, query: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('submitQuizResult', () => {
    it('should return 404 if quiz is not found', async () => {
      req.params = { id: 'missing_quiz' };
      vi.spyOn(quizRepository, 'findByIdAndUser').mockResolvedValue(null);

      await submitQuizResult(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Quiz not found.' })
      );
    });

    it('should compute score, percentage, bestScore, and append attempt log', async () => {
      req.params = { id: 'quiz_123' };
      req.body = {
        answers: [
          { questionIndex: 0, selectedOption: 1 }, // Correct
          { questionIndex: 1, selectedOption: 3 }, // Wrong (correct is 2)
        ],
        timeSpentSeconds: 45,
      };

      const mockQuizInstance = {
        _id: 'quiz_123',
        title: 'Operating Systems Quiz',
        subject: 'Operating Systems',
        totalQuestions: 2,
        questions: [
          { question: 'Q1?', options: ['A', 'B', 'C', 'D'], correctAnswer: 1 },
          { question: 'Q2?', options: ['A', 'B', 'C', 'D'], correctAnswer: 2 },
        ],
        attempts: [],
        bestScore: 0,
        bestPercentage: 0,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(quizRepository, 'findByIdAndUser').mockResolvedValue(mockQuizInstance);
      vi.spyOn(progressRepository, 'addRecentActivity').mockResolvedValue(true);

      await submitQuizResult(req, res);

      expect(mockQuizInstance.attempts).toHaveLength(1);
      expect(mockQuizInstance.attempts[0].score).toBe(1);
      expect(mockQuizInstance.attempts[0].percentage).toBe(50); // 1 out of 2 = 50%
      expect(mockQuizInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            score: 1,
            totalQuestions: 2,
            percentage: 50,
          }),
        })
      );
    });
  });
});
