import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const parts = req.headers.authorization.trim().split(/\s+/);
      const tokenParts = parts.filter((p) => p.toLowerCase() !== 'bearer');
      token = tokenParts[tokenParts.length - 1] || '';

      if (token) {
        token = token.replace(/^["']|["']$/g, '').trim();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || '123456');

      req.user = await userRepository.findByIdWithoutPassword(decoded.id);

      if (!req.user) {
        res.status(401);
        return next(new Error('User not found or account removed'));
      }

      return next();
    } catch (error) {
      res.status(401);
      return next(new Error(`Not authorized: ${error.message}`));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }
};
