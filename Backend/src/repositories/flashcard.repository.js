import { BaseRepository } from './base.repository.js';
import Flashcard from '../models/flashcard.model.js';

/**
 * FlashcardRepository
 * Encapsulates database operations for the Flashcard entity.
 */
export class FlashcardRepository extends BaseRepository {
  constructor() {
    super(Flashcard);
  }

  /**
   * Find user flashcards with query filters and sorting
   * @param {Object} filter - Query filter object
   * @param {Object} [sort]
   * @returns {import('mongoose').Query}
   */
  findWithSort(filter = {}, sort = { updatedAt: -1, createdAt: -1 }) {
    return this.find(filter).sort(sort);
  }

  /**
   * Get all flashcards belonging to a user
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @returns {import('mongoose').Query}
   */
  findAllByUser(userId) {
    return this.find({ userId });
  }

  /**
   * Find a specific flashcard ensuring ownership by user
   * @param {string|import('mongoose').Types.ObjectId} id
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @returns {import('mongoose').Query}
   */
  findByIdAndUser(id, userId) {
    return this.findOne({ _id: id, userId });
  }

  /**
   * Delete a flashcard ensuring ownership by user
   * @param {string|import('mongoose').Types.ObjectId} id
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @returns {import('mongoose').Query}
   */
  deleteByIdAndUser(id, userId) {
    return this.findOneAndDelete({ _id: id, userId });
  }

  /**
   * Reset mastery status for all flashcards of a user (or filtered by subject)
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @param {string} [subject]
   * @returns {import('mongoose').Query}
   */
  resetDeckMastery(userId, subject = null) {
    const query = { userId };
    if (subject && subject !== 'all') {
      query.subject = { $regex: new RegExp(`^${subject.trim()}$`, 'i') };
    }
    return this.updateMany(query, {
      $set: { isMastered: false },
    });
  }
}

export const flashcardRepository = new FlashcardRepository();
export default flashcardRepository;
