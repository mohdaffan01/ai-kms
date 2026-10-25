/**
 * Base Repository
 * Provides reusable generic data access methods for Mongoose models.
 */
export class BaseRepository {
  /**
   * @param {import('mongoose').Model} model - Mongoose model instance
   */
  constructor(model) {
    if (!model) {
      throw new Error('A valid Mongoose model must be provided to BaseRepository.');
    }
    this.model = model;
  }

  /**
   * Create a new document in the database
   * @param {Object} data - Document payload
   * @returns {Promise<import('mongoose').Document>}
   */
  async create(data) {
    return await this.model.create(data);
  }

  /**
   * Insert multiple documents in bulk
   * @param {Array<Object>} docs - Array of documents
   * @param {Object} [options]
   * @returns {Promise<Array<import('mongoose').Document>>}
   */
  async insertMany(docs, options = {}) {
    return await this.model.insertMany(docs, options);
  }

  /**
   * Find document by ID
   * @param {string|import('mongoose').Types.ObjectId} id
   * @param {Object|string} [projection]
   * @param {Object} [options]
   * @returns {import('mongoose').Query}
   */
  findById(id, projection = null, options = {}) {
    return this.model.findById(id, projection, options);
  }

  /**
   * Find a single document matching the filter
   * @param {Object} [filter]
   * @param {Object|string} [projection]
   * @param {Object} [options]
   * @returns {import('mongoose').Query}
   */
  findOne(filter = {}, projection = null, options = {}) {
    return this.model.findOne(filter, projection, options);
  }

  /**
   * Find multiple documents matching the filter
   * @param {Object} [filter]
   * @param {Object|string} [projection]
   * @param {Object} [options]
   * @returns {import('mongoose').Query}
   */
  find(filter = {}, projection = null, options = {}) {
    return this.model.find(filter, projection, options);
  }

  /**
   * Update a document by its ID
   * @param {string|import('mongoose').Types.ObjectId} id
   * @param {Object} update
   * @param {Object} [options]
   * @returns {import('mongoose').Query}
   */
  findByIdAndUpdate(id, update, options = { new: true }) {
    return this.model.findByIdAndUpdate(id, update, options);
  }

  /**
   * Update a single document matching the filter
   * @param {Object} filter
   * @param {Object} update
   * @param {Object} [options]
   * @returns {import('mongoose').Query}
   */
  findOneAndUpdate(filter, update, options = { new: true }) {
    return this.model.findOneAndUpdate(filter, update, options);
  }

  /**
   * Update a single document without returning it
   * @param {Object} filter
   * @param {Object} update
   * @param {Object} [options]
   * @returns {import('mongoose').Query}
   */
  updateOne(filter, update, options = {}) {
    return this.model.updateOne(filter, update, options);
  }

  /**
   * Update multiple documents matching the filter
   * @param {Object} filter
   * @param {Object} update
   * @param {Object} [options]
   * @returns {import('mongoose').Query}
   */
  updateMany(filter, update, options = {}) {
    return this.model.updateMany(filter, update, options);
  }

  /**
   * Delete a document by its ID
   * @param {string|import('mongoose').Types.ObjectId} id
   * @param {Object} [options]
   * @returns {import('mongoose').Query}
   */
  findByIdAndDelete(id, options = {}) {
    return this.model.findByIdAndDelete(id, options);
  }

  /**
   * Delete a single document matching the filter
   * @param {Object} filter
   * @param {Object} [options]
   * @returns {import('mongoose').Query}
   */
  findOneAndDelete(filter = {}, options = {}) {
    return this.model.findOneAndDelete(filter, options);
  }

  /**
   * Delete multiple documents matching the filter
   * @param {Object} filter
   * @param {Object} [options]
   * @returns {import('mongoose').Query}
   */
  deleteMany(filter = {}, options = {}) {
    return this.model.deleteMany(filter, options);
  }

  /**
   * Count documents matching the filter
   * @param {Object} [filter]
   * @returns {import('mongoose').Query}
   */
  countDocuments(filter = {}) {
    return this.model.countDocuments(filter);
  }

  /**
   * Check whether at least one document matches the filter
   * @param {Object} filter
   * @returns {Promise<Object|null>}
   */
  async exists(filter = {}) {
    return await this.model.exists(filter);
  }

  /**
   * Persist changes on a document instance
   * @param {import('mongoose').Document} doc
   * @returns {Promise<import('mongoose').Document>}
   */
  async save(doc) {
    return await doc.save();
  }

  /**
   * Execute an aggregation pipeline
   * @param {Array<Object>} pipeline
   * @returns {import('mongoose').Aggregate}
   */
  aggregate(pipeline = []) {
    return this.model.aggregate(pipeline);
  }
}

export default BaseRepository;
