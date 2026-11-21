import express from 'express';
import {
  registerUser,
  loginUser,
  googleAuth,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  forgotPassword,
  resetPassword,
  resetPasswordWithOtp,
} from '../controllers/user.Controller.js';
import { protect } from '../middleware/authMiddleware.js';

const authRoutes = express.Router();
const userRoutes = express.Router();

// Auth Routes: /api/auth
authRoutes.post('/register', registerUser);
authRoutes.post('/login', loginUser);
authRoutes.post('/google', googleAuth);
authRoutes.post('/forgot-password', forgotPassword);
authRoutes.post('/reset-password-otp', resetPasswordWithOtp);
authRoutes.post('/reset-password/:token', resetPassword);
authRoutes.get('/me', protect, getUserProfile);

// User Routes: /api/users
userRoutes.put('/profile', protect, updateUserProfile);
userRoutes.put('/change-password', protect, changeUserPassword);

export { authRoutes, userRoutes };
export default { authRoutes, userRoutes };

