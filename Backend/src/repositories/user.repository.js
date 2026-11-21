import { BaseRepository } from './base.repository.js';
import User from '../models/user.model.js';

/**
 * UserRepository
 * Encapsulates database operations for the User entity.
 */
export class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find a user by their email address (case-insensitive normalized)
   * @param {string} email
   * @param {Object|string} [projection]
   * @returns {import('mongoose').Query}
   */
  findByEmail(email, projection = null) {
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    return this.findOne({ email: normalizedEmail }, projection);
  }

  /**
   * Find a user by their Google OAuth ID
   * @param {string} googleId
   * @param {Object|string} [projection]
   * @returns {import('mongoose').Query}
   */
  findByGoogleId(googleId, projection = null) {
    if (!googleId) return null;
    return this.findOne({ googleId }, projection);
  }

  /**
   * Find a user by ID without sensitive password field
   * @param {string|import('mongoose').Types.ObjectId} id
   * @returns {import('mongoose').Query}
   */
  findByIdWithoutPassword(id) {
    return this.findById(id).select('-password');
  }

  /**
   * Check if an email is already registered, optionally excluding a user ID
   * @param {string} email
   * @param {string|import('mongoose').Types.ObjectId} [excludeUserId]
   * @returns {Promise<boolean>}
   */
  async isEmailTaken(email, excludeUserId = null) {
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const query = { email: normalizedEmail };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }
    const existing = await this.findOne(query);
    return Boolean(existing);
  }
}

export const userRepository = new UserRepository();
export default userRepository;
