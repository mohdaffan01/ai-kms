import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
} from '../controllers/user.Controller.js';
import { protect } from '../middleware/authMiddleware.js';

const authRoutes = express.Router();
const userRoutes = express.Router();

// Auth Routes: /api/auth
authRoutes.post('/register', registerUser);
authRoutes.post('/login', loginUser);
authRoutes.get('/me', protect, getUserProfile);

// User Routes: /api/users
userRoutes.put('/profile', protect, updateUserProfile);
userRoutes.put('/change-password', protect, changeUserPassword);

export { authRoutes, userRoutes };
export default { authRoutes, userRoutes };
