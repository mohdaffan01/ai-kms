import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getFlashcards,
  generateFlashcards,
  createManualFlashcard,
  toggleFlashcardMastered,
  deleteFlashcard,
  resetDeckMastery,
} from '../controllers/flashcard.controller.js';

const router = express.Router();

// Retrieve user's flashcards (supports filters: ?subject=...&topic=...&filter=mastered|learning&search=...)
router.get('/', protect, getFlashcards);

// Generate flashcards using AI from completed topics and uploaded documents
router.post('/generate', protect, generateFlashcards);

// Create manual flashcard
router.post('/', protect, createManualFlashcard);

// Toggle mastery status
router.patch('/:id/master', protect, toggleFlashcardMastered);

// Delete single flashcard
router.delete('/:id', protect, deleteFlashcard);

// Reset mastery for a subject to practice again
router.post('/reset-mastery', protect, resetDeckMastery);

export default router;
