import Document from '../models/document.model.js';
import { processDocument } from '../services/documentProcessor.js';
import { generateEmbedding } from '../services/embeddingService.js';
import { searchVectors, deleteVectorsByDocument } from '../services/qdrantService.js';
import path from 'path';

/**
 * @desc    Process uploaded document (Extract -> Clean -> Chunk -> Embed -> Qdrant Store)
 * @route   POST /api/knowledge/process/:documentId
 * @access  Private
 */
export const processDocumentKnowledge = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    // 1. Fetch document from MongoDB
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // 2. Validate document ownership
    if (document.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to process this document' });
    }

    // 3. Update status to processing
    document.status = 'processing';
    await document.save();

    // 4. Construct absolute path to stored file
    const absoluteFilePath = path.resolve(document.filePath);

    // 5. Run processing pipeline
    const summary = await processDocument(
      absoluteFilePath,
      document.fileType || 'application/pdf',
      document._id,
      userId
    );

    // 6. Update document status to processed
    document.status = 'processed';
    await document.save();

    res.status(200).json({
      success: true,
      message: 'Document processed, vectorized, and indexed successfully',
      documentId: document._id,
      status: document.status,
      summary,
    });
  } catch (error) {
    console.error(`[KnowledgeController] Processing error:`, error);

    // Attempt to update document status to failed if record exists
    if (req.params.documentId) {
      try {
        await Document.findByIdAndUpdate(req.params.documentId, { status: 'failed' });
      } catch (dbErr) {
        console.error(`[KnowledgeController] Failed to update document status:`, dbErr);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process document for vector storage',
      error: error.message,
    });
  }
};

/**
 * @desc    Perform user-isolated semantic RAG search across indexed documents
 * @route   POST /api/knowledge/search
 * @access  Private
 */
export const searchKnowledge = async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    const userId = req.user._id;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ message: 'A non-empty query string is required' });
    }

    // 1. Generate query embedding
    const queryVector = await generateEmbedding(query.trim());

    // 2. Perform vector search in Qdrant with userId isolation filter
    const matches = await searchVectors(userId, queryVector, parseInt(limit, 10));

    res.status(200).json({
      success: true,
      query: query.trim(),
      totalMatches: matches.length,
      results: matches.map((match) => ({
        score: match.score,
        documentId: match.payload.documentId,
        chunkIndex: match.payload.chunkIndex,
        text: match.payload.text,
        createdAt: match.payload.createdAt,
      })),
    });
  } catch (error) {
    console.error(`[KnowledgeController] Search error:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform semantic search',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete document vectors from Qdrant vector store
 * @route   DELETE /api/knowledge/:documentId
 * @access  Private
 */
export const deleteDocumentKnowledge = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    const document = await Document.findById(documentId);
    if (document && document.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this document vectors' });
    }

    // Delete vectors from Qdrant
    await deleteVectorsByDocument(documentId);

    res.status(200).json({
      success: true,
      message: 'Document vector embeddings deleted from Qdrant successfully',
      documentId,
    });
  } catch (error) {
    console.error(`[KnowledgeController] Delete vectors error:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document vector embeddings',
      error: error.message,
    });
  }
};

export default {
  processDocumentKnowledge,
  searchKnowledge,
  deleteDocumentKnowledge,
};
