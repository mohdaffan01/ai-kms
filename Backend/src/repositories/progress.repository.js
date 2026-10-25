import { BaseRepository } from './base.repository.js';
import Progress from '../models/progress.model.js';

/**
 * ProgressRepository
 * Encapsulates database operations for the Progress entity.
 */
export class ProgressRepository extends BaseRepository {
  constructor() {
    super(Progress);
  }

  /**
   * Find study progress record by userId
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @returns {import('mongoose').Query}
   */
  findByUserId(userId) {
    return this.findOne({ userId });
  }

  /**
   * Create an initial progress record for a user
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @param {Array<Object>} [subjects]
   * @param {Array<Object>} [recentActivities]
   * @returns {Promise<import('mongoose').Document>}
   */
  async createForUser(userId, subjects = [], recentActivities = []) {
    return await this.create({
      userId,
      subjects,
      recentActivities,
    });
  }

  /**
   * Push a recent activity to user's progress log
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @param {Object} activity
   * @param {number} [sliceLimit]
   * @returns {import('mongoose').Query}
   */
  addRecentActivity(userId, activity, sliceLimit = 15) {
    return this.findOneAndUpdate(
      { userId },
      {
        $push: {
          recentActivities: {
            $each: [activity],
            $position: 0,
            $slice: sliceLimit,
          },
        },
      },
      { new: true }
    );
  }

  /**
   * Instantiate a new unsaved Progress model document
   * @param {Object} data
   * @returns {import('mongoose').Document}
   */
  instantiate(data) {
    return new this.model(data);
  }
}

export const progressRepository = new ProgressRepository();
export default progressRepository;
