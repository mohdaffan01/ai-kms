import Document from '../models/document.model.js';
import { processDocument, extractTextFromPdf } from '../services/documentProcessor.js';
import { generateEmbedding } from '../services/embeddingService.js';
import { searchVectors, deleteVectorsByDocument } from '../services/chromaService.js';
import path from 'path';
import fs from 'fs';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const LLM_MODEL = process.env.LLM_MODEL || 'llama3';

/**
 * @desc    Process uploaded document (Extract -> Clean -> Chunk -> Embed -> ChromaDB Store)
 * @route   POST /api/knowledge/process/:documentId
 * @access  Private
 */
export const processDocumentKnowledge = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id || req.user.id;

    // 1. Fetch document from MongoDB
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // 2. Validate document ownership
    if (document.uploadedBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to process this document' });
    }

    // 3. Update status to processing
    document.processingStatus = 'processing';
    await document.save();

    // 4. Construct absolute path to stored file
    const absoluteFilePath = path.resolve(document.filePath);

    // 5. Run processing pipeline
    const summary = await processDocument(
      absoluteFilePath,
      document.mimeType || 'application/pdf',
      document._id,
      userId
    );

    // 6. Update document status to processed
    document.processingStatus = 'processed';
    await document.save();

    res.status(200).json({
      success: true,
      message: 'Document processed, vectorized, and indexed successfully',
      documentId: document._id,
      status: document.processingStatus,
      summary,
    });
  } catch (error) {
    console.error(`[KnowledgeController] Processing error:`, error);

    if (req.params.documentId) {
      try {
        await Document.findByIdAndUpdate(req.params.documentId, { processingStatus: 'failed' });
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
    const userId = req.user._id || req.user.id;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ message: 'A non-empty query string is required' });
    }

    // 1. Generate query embedding
    const queryVector = await generateEmbedding(query.trim());

    // 2. Perform vector search in ChromaDB with userId isolation filter
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
 * @desc    RAG Chat Query API - Answers user question grounded in uploaded PDF/document content
 * @route   POST /api/knowledge/chat
 * @access  Private
 */
export const queryRagChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id || req.user.id;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message query string is required.',
      });
    }

    const userQuery = message.trim();

    // 1. Check if user has uploaded documents in MongoDB
    const userDocs = await Document.find({ uploadedBy: userId }).sort({ createdAt: -1 });

    if (!userDocs || userDocs.length === 0) {
      return res.status(200).json({
        success: true,
        answer: "I couldn't find any uploaded study materials in your workspace. Please upload a PDF or document using the sidebar upload button so I can answer questions directly from it!",
        sources: [],
      });
    }

    // 2. Try Vector Search via ChromaDB & Ollama Embeddings
    let ragMatches = [];
    try {
      const queryVector = await generateEmbedding(userQuery);
      ragMatches = await searchVectors(userId, queryVector, 4);
    } catch (vectorErr) {
      console.warn(`[KnowledgeController] Vector RAG search unavailable (${vectorErr.message}). Falling back to document text extraction.`);
    }

    // 3. If vector matches were found via ChromaDB
    if (ragMatches && ragMatches.length > 0) {
      const contextTexts = ragMatches.map((m) => m.payload.text).join('\n\n---\n\n');
      const docIds = [...new Set(ragMatches.map((m) => m.payload.documentId))];
      const matchedDocs = await Document.find({ _id: { $in: docIds } });
      const sourceTitles = matchedDocs.map((d) => d.title);

      // Attempt LLM generation via Ollama
      try {
        const prompt = `System: You are an AI Study Assistant for AiKMS. Answer the user's question accurately using ONLY the provided document context below. If the context does not contain enough info, summarize what is available from the document context.\n\nDOCUMENT CONTEXT:\n${contextTexts}\n\nUSER QUESTION: ${userQuery}`;

        const llmRes = await fetch(`${OLLAMA_HOST}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: LLM_MODEL,
            prompt,
            stream: false,
          }),
        });

        if (llmRes.ok) {
          const llmData = await llmRes.json();
          if (llmData.response) {
            return res.status(200).json({
              success: true,
              answer: llmData.response,
              sources: sourceTitles,
              snippets: ragMatches.map((m) => m.payload.text.substring(0, 150) + '...'),
            });
          }
        }
      } catch (llmErr) {
        console.warn(`[KnowledgeController] Local LLM generate fallback: ${llmErr.message}`);
      }

      // Grounded Context Fallback (When Ollama LLM generator is offline)
      const topMatch = ragMatches[0].payload.text;
      const formattedAnswer = `Based on your uploaded document (${sourceTitles.join(', ') || 'Uploaded PDF'}):\n\n"${topMatch}"`;

      return res.status(200).json({
        success: true,
        answer: formattedAnswer,
        sources: sourceTitles,
        snippets: ragMatches.map((m) => m.payload.text.substring(0, 200) + '...'),
      });
    }

    // 4. Fallback Direct PDF Text Extraction (If ChromaDB service is not running locally)
    const latestDoc = userDocs[0];
    const fullPath = path.resolve(latestDoc.filePath);

    if (fs.existsSync(fullPath)) {
      let extractedText = '';
      if (latestDoc.mimeType?.includes('pdf') || latestDoc.originalFileName?.endsWith('.pdf')) {
        extractedText = await extractTextFromPdf(fullPath);
      } else {
        extractedText = fs.readFileSync(fullPath, 'utf-8');
      }

      if (extractedText && extractedText.trim()) {
        const queryLower = userQuery.toLowerCase();
        const sentences = extractedText.split(/(?<=[.?!])\s+/);

        // Find sentences matching user query keywords
        const keywords = queryLower.split(' ').filter((w) => w.length > 3);
        const matchingSentences = sentences.filter((s) =>
          keywords.some((kw) => s.toLowerCase().includes(kw))
        );

        let answerText = '';
        if (matchingSentences.length > 0) {
          answerText = `Based on your uploaded document "${latestDoc.title}":\n\n` + matchingSentences.slice(0, 4).join(' ');
        } else {
          answerText = `From your uploaded document "${latestDoc.title}":\n\n` + extractedText.trim().substring(0, 400) + '...';
        }

        return res.status(200).json({
          success: true,
          answer: answerText,
          sources: [latestDoc.title],
          snippets: [extractedText.substring(0, 150) + '...'],
        });
      }
    }

    return res.status(200).json({
      success: true,
      answer: `I found your uploaded document "${latestDoc.title}", but could not extract readable text passages. Please ensure it contains readable text.`,
      sources: [latestDoc.title],
    });
  } catch (error) {
    console.error(`[KnowledgeController] RAG Chat error:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to process RAG chat query',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete document vectors from ChromaDB vector store
 * @route   DELETE /api/knowledge/:documentId
 * @access  Private
 */
export const deleteDocumentKnowledge = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id || req.user.id;

    const document = await Document.findById(documentId);
    if (document && document.uploadedBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this document vectors' });
    }

    // Delete vectors from ChromaDB
    await deleteVectorsByDocument(documentId);

    res.status(200).json({
      success: true,
      message: 'Document vector embeddings deleted from ChromaDB successfully',
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
  queryRagChat,
  deleteDocumentKnowledge,
};
