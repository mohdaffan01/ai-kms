import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createManualFlashcard,
  toggleFlashcardMastered,
  deleteFlashcard,
} from '../../../src/controllers/flashcard.controller.js';
import { flashcardRepository } from '../../../src/repositories/flashcard.repository.js';
import { mockUser } from '../../fixtures/sampleData.js';

describe('Controller: flashcardController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, user: { _id: mockUser._id }, params: {}, query: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('createManualFlashcard', () => {
    it('should reject creation if subject, front, or back are missing', async () => {
      req.body = { subject: 'OS', front: '' }; // missing back

      await createManualFlashcard(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Subject, Front (Question), and Back (Answer) are required.',
        })
      );
    });

    it('should create custom flashcard with default medium difficulty', async () => {
      req.body = {
        subject: 'Operating Systems',
        topic: 'Deadlocks',
        front: 'What is a deadlock?',
        back: 'A situation where a set of processes are blocked because each process is holding a resource.',
      };

      vi.spyOn(flashcardRepository, 'create').mockResolvedValue({
        _id: 'card_123',
        ...req.body,
        difficulty: 'medium',
        isMastered: false,
        source: 'custom',
      });

      await createManualFlashcard(req, res);

      expect(flashcardRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Operating Systems',
          topic: 'Deadlocks',
          difficulty: 'medium',
          source: 'custom',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Flashcard created successfully.',
        })
      );
    });
  });

  describe('toggleFlashcardMastered', () => {
    it('should return 404 if flashcard is not found or belongs to another user', async () => {
      req.params = { id: 'non_existent_card' };
      vi.spyOn(flashcardRepository, 'findByIdAndUser').mockResolvedValue(null);

      await toggleFlashcardMastered(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Flashcard not found.' })
      );
    });

    it('should toggle isMastered flag, increment reviewCount, and save', async () => {
      req.params = { id: 'card_to_master' };
      req.body = { isMastered: true };

      const mockCardInstance = {
        _id: 'card_to_master',
        isMastered: false,
        reviewCount: 1,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(flashcardRepository, 'findByIdAndUser').mockResolvedValue(mockCardInstance);

      await toggleFlashcardMastered(req, res);

      expect(mockCardInstance.isMastered).toBe(true);
      expect(mockCardInstance.reviewCount).toBe(2);
      expect(mockCardInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Marked as mastered!',
        })
      );
    });
  });

  describe('deleteFlashcard', () => {
    it('should return 404 if card is not found', async () => {
      req.params = { id: 'missing_card' };
      vi.spyOn(flashcardRepository, 'deleteByIdAndUser').mockResolvedValue(null);

      await deleteFlashcard(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete card and return 200 on success', async () => {
      req.params = { id: 'card_to_delete' };
      vi.spyOn(flashcardRepository, 'deleteByIdAndUser').mockResolvedValue({ _id: 'card_to_delete' });

      await deleteFlashcard(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Flashcard deleted successfully.',
        })
      );
    });
  });
});
