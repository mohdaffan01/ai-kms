import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getQuizzes,
  getQuizById,
  generateQuiz,
  submitQuizResult,
  deleteQuiz,
} from '../controllers/quiz.controller.js';

const router = express.Router();

// Retrieve user's quizzes & aggregate stats (?subject=...)
router.get('/', protect, getQuizzes);

// Generate new quiz using AI grounded in completed topics and notes
router.post('/generate', protect, generateQuiz);

// Get single quiz with questions & attempt history
router.get('/:id', protect, getQuizById);

// Submit quiz answers, score, and record attempt
router.post('/:id/submit', protect, submitQuizResult);

// Delete quiz directly
router.delete('/:id', protect, deleteQuiz);

export default router;
