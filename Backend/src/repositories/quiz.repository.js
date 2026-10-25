import { BaseRepository } from './base.repository.js';
import Quiz from '../models/quiz.model.js';

/**
 * QuizRepository
 * Encapsulates database operations for the Quiz entity.
 */
export class QuizRepository extends BaseRepository {
  constructor() {
    super(Quiz);
  }

  /**
   * Find quizzes for a user with optional subject filter and sorting
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @param {string} [subject]
   * @param {Object} [sort]
   * @returns {import('mongoose').Query}
   */
  findUserQuizzes(userId, subject = null, sort = { createdAt: -1 }) {
    const query = { userId };
    if (subject && subject !== 'all') {
      query.subject = { $regex: new RegExp(`^${subject.trim()}$`, 'i') };
    }
    return this.find(query).sort(sort);
  }

  /**
   * Find a specific quiz ensuring ownership by user
   * @param {string|import('mongoose').Types.ObjectId} id
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @returns {import('mongoose').Query}
   */
  findByIdAndUser(id, userId) {
    return this.findOne({ _id: id, userId });
  }

  /**
   * Delete a quiz ensuring ownership by user
   * @param {string|import('mongoose').Types.ObjectId} id
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @returns {import('mongoose').Query}
   */
  deleteByIdAndUser(id, userId) {
    return this.findOneAndDelete({ _id: id, userId });
  }
}

export const quizRepository = new QuizRepository();
export default quizRepository;
