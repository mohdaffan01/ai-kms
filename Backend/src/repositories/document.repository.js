import { BaseRepository } from './base.repository.js';
import Document from '../models/document.model.js';

/**
 * DocumentRepository
 * Encapsulates database operations for the Document entity.
 */
export class DocumentRepository extends BaseRepository {
  constructor() {
    super(Document);
  }

  /**
   * Find documents uploaded by a specific user with optional sorting
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @param {Object} [sort]
   * @returns {import('mongoose').Query}
   */
  findUserDocuments(userId, sort = { createdAt: -1 }) {
    return this.find({ uploadedBy: userId }).sort(sort);
  }

  /**
   * Find documents matching user and filter criteria (subject, topic, folder)
   * @param {Object} criteria
   * @param {string|import('mongoose').Types.ObjectId} criteria.uploadedBy
   * @param {string} [criteria.subject]
   * @param {string} [criteria.topic]
   * @param {string} [criteria.folder]
   * @param {Object} [sort]
   * @returns {import('mongoose').Query}
   */
  findUserDocumentsByFilter(criteria, sort = { createdAt: -1 }) {
    const filter = { uploadedBy: criteria.uploadedBy };
    if (criteria.subject) filter.subject = criteria.subject;
    if (criteria.topic) filter.topic = criteria.topic;
    if (criteria.folder) filter.folder = criteria.folder;
    return this.find(filter).sort(sort);
  }

  /**
   * Find user documents by subject name (case-insensitive regex)
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @param {string} subject
   * @param {Object} [sort]
   * @returns {import('mongoose').Query}
   */
  findUserDocumentsBySubject(userId, subject, sort = { createdAt: -1 }) {
    return this.find({
      uploadedBy: userId,
      subject: { $regex: new RegExp(`^${subject.trim()}$`, 'i') },
    }).sort(sort);
  }

  /**
   * Find documents with IDs in an array of document IDs
   * @param {Array<string|import('mongoose').Types.ObjectId>} docIds
   * @returns {import('mongoose').Query}
   */
  findDocumentsByIds(docIds) {
    return this.find({ _id: { $in: docIds } });
  }

  /**
   * Update document vector processing status
   * @param {string|import('mongoose').Types.ObjectId} id
   * @param {string} status
   * @param {string|null} [error]
   * @returns {import('mongoose').Query}
   */
  updateProcessingStatus(id, status, error = null) {
    const update = { processingStatus: status };
    if (error !== undefined) {
      update.processingError = error;
    }
    return this.findByIdAndUpdate(id, update);
  }

  /**
   * Reassign/rename subject across all documents uploaded by a user
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @param {string} oldSubjectName
   * @param {string} newSubjectName
   * @returns {import('mongoose').Query}
   */
  updateSubjectName(userId, oldSubjectName, newSubjectName) {
    return this.updateMany(
      {
        uploadedBy: userId,
        subject: { $regex: new RegExp(`^${oldSubjectName.trim()}$`, 'i') },
      },
      { $set: { subject: newSubjectName } }
    );
  }
}

export const documentRepository = new DocumentRepository();
export default documentRepository;
