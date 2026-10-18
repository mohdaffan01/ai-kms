import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getDashboardData,
  toggleTopic,
  createSubject,
  deleteSubject,
  addTopicToSubject,
  resetDefaultSubjects,
} from '../controllers/progress.controller.js';

const progressRoutes = express.Router();

// Dashboard overview & statistics
progressRoutes.get('/dashboard', protect, getDashboardData);

// Topic completion toggle
progressRoutes.put('/toggle-topic', protect, toggleTopic);

// Subject management
progressRoutes.post('/subject', protect, createSubject);
progressRoutes.delete('/subject/:subjectId', protect, deleteSubject);
progressRoutes.post('/subject/:subjectId/topic', protect, addTopicToSubject);
progressRoutes.post('/reset-defaults', protect, resetDefaultSubjects);

export default progressRoutes;
