import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  processDocumentKnowledge,
  searchKnowledge,
  queryRagChat,
  deleteDocumentKnowledge,
} from '../controllers/knowledge.controller.js';

const router = express.Router();

// All knowledge endpoints require JWT authentication
router.post('/process/:documentId', protect, processDocumentKnowledge);
router.post('/search', protect, searchKnowledge);
router.post('/chat', protect, queryRagChat);
router.delete('/:documentId', protect, deleteDocumentKnowledge);

export default router;



