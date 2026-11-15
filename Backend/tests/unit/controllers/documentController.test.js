import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import {
  resolveDocumentStats,
  uploadDocument,
  getMyDocuments,
  deleteDocument,
} from '../../../src/controllers/document.controller.js';
import { documentRepository } from '../../../src/repositories/document.repository.js';
import { progressRepository } from '../../../src/repositories/progress.repository.js';
import { mockDocument, mockUser } from '../../fixtures/sampleData.js';

describe('Controller: documentController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, user: { _id: mockUser._id }, params: {}, query: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('resolveDocumentStats', () => {
    it('should calculate words, lines, and character count for text note content', async () => {
      const note = 'First line of notes.\nSecond line of notes.';
      const stats = await resolveDocumentStats(null, 'text/plain', 'note.txt', note);

      expect(stats.pageCount).toBe(1);
      expect(stats.wordCount).toBe(8);
      expect(stats.lineCount).toBe(2);
      expect(stats.charCount).toBe(note.length);
    });

    it('should return default zero stats when filePath and noteContent are empty', async () => {
      const stats = await resolveDocumentStats(null, '', '');
      expect(stats).toEqual({ pageCount: 1, wordCount: 0, lineCount: 0, charCount: 0 });
    });
  });

  describe('uploadDocument', () => {
    it('should return 400 if no file is provided in request', async () => {
      req.body = { title: 'OS Notes', subject: 'OS' };
      req.file = null;

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Please upload a valid document file.' })
      );
    });

    it('should return 400 if title or subject is missing', async () => {
      req.file = { path: 'uploads/temp.pdf', mimetype: 'application/pdf', originalname: 'temp.pdf' };
      req.body = { title: '' }; // missing subject

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Title and subject are required.' })
      );
    });

    it('should reject blank documents containing less than 3 readable characters and delete file', async () => {
      req.body = { title: 'Blank PDF', subject: 'Testing' };
      req.file = {
        path: 'uploads/blank.txt',
        mimetype: 'text/plain',
        originalname: 'blank.txt',
        filename: 'blank.txt',
      };

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('  ');
      const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('less than 3 characters'),
        })
      );
      expect(unlinkSpy).toHaveBeenCalledWith('uploads/blank.txt');
    });

    it('should successfully create document record for valid upload', async () => {
      req.body = { title: 'Process Scheduling', subject: 'Operating Systems' };
      req.file = {
        path: 'uploads/os.txt',
        mimetype: 'text/plain',
        originalname: 'os.txt',
        filename: 'os.txt',
      };

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('A comprehensive guide to CPU scheduling.');
      vi.spyOn(progressRepository, 'findOne').mockResolvedValue(null);
      vi.spyOn(documentRepository, 'create').mockResolvedValue({
        _id: 'doc_new_1',
        title: 'Process Scheduling',
        subject: 'Operating Systems',
        uploadedBy: mockUser._id,
      });

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Document uploaded successfully.',
        })
      );
    });
  });

  describe('getMyDocuments', () => {
    it('should return documents list belonging to authenticated user', async () => {
      const mockQueryChain = {
        sort: vi.fn().mockResolvedValue([mockDocument]),
      };
      vi.spyOn(documentRepository, 'find').mockReturnValue(mockQueryChain);

      await getMyDocuments(req, res);

      expect(documentRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ uploadedBy: mockUser._id })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        documents: [mockDocument],
      });
    });
  });

  describe('deleteDocument', () => {
    it('should return 404 if document does not exist', async () => {
      req.params = { id: 'non_existent_doc_id' };
      vi.spyOn(documentRepository, 'findById').mockResolvedValue(null);

      await deleteDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Document not found.' })
      );
    });

    it('should return 403 if document belongs to another user', async () => {
      req.params = { id: 'other_user_doc' };
      vi.spyOn(documentRepository, 'findById').mockResolvedValue({
        ...mockDocument,
        uploadedBy: 'different_user_id',
      });

      await deleteDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Not authorized to delete this document.' })
      );
    });

    it('should delete document and disk file on authorized request', async () => {
      req.params = { id: mockDocument._id };
      vi.spyOn(documentRepository, 'findById').mockResolvedValue(mockDocument);
      vi.spyOn(fs, 'existsSync').mockReturnValue(false); // file already unlinked or clean
      vi.spyOn(documentRepository, 'findByIdAndDelete').mockResolvedValue(true);

      await deleteDocument(req, res);

      expect(documentRepository.findByIdAndDelete).toHaveBeenCalledWith(mockDocument._id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Document deleted successfully.' })
      );
    });
  });
});
