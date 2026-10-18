import Document from '../models/document.model.js';
import { processDocument, extractTextFromPdf } from '../services/documentProcessor.js';
import { cleanText } from '../services/textCleaner.js';
import { generateEmbedding } from '../services/embeddingService.js';
import { searchVectors, deleteVectorsByDocument } from '../services/chromaService.js';
import path from 'path';
import fs from 'fs';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

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

    // 4. Construct absolute path to stored file (handles both Backend/ and root CWD)
    const absoluteFilePath = getExistingFilePath(document.filePath);

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
 * Helper: Detect greetings
 */
const isGreeting = (text) => {
  const clean = text.toLowerCase().trim().replace(/[^\w\s]/gi, '');
  const greetingWords = ['hey', 'hello', 'hi', 'hey there', 'hi there', 'good morning', 'good afternoon', 'good evening', 'who are you', 'help'];
  return greetingWords.includes(clean);
};

/**
 * Helper: Detect summary request
 */
const isSummaryRequest = (text) => {
  const clean = text.toLowerCase();
  return (
    clean.includes('summary') ||
    clean.includes('summarize') ||
    clean.includes('overview') ||
    clean.includes('what is this pdf about') ||
    clean.includes('what is this document about') ||
    clean.includes('main points')
  );
};

/**
 * Helper: Clean media player artifacts and noise
 */
const cleanPdfNoise = (raw) => {
  if (!raw) return '';
  let text = cleanText(raw);
  text = text.replace(/\d+\s*seconds\s*of\s*\d+\s*seconds\s*Volume\s*\d+%/gi, '');
  text = text.replace(/GeeksforGeeks|www\.[a-z0-9.]+/gi, '');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n+/g, '\n\n');
  return text.trim();
};

/**
 * Helper: Resolve existing file path regardless of whether CWD is Backend or project root
 */
export const getExistingFilePath = (filePath) => {
  if (!filePath) return '';
  if (path.isAbsolute(filePath) && fs.existsSync(filePath)) return filePath;
  const p1 = path.resolve(process.cwd(), filePath);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve(process.cwd(), 'Backend', filePath);
  if (fs.existsSync(p2)) return p2;
  const p3 = path.resolve(process.cwd(), 'uploads', path.basename(filePath));
  if (fs.existsSync(p3)) return p3;
  const p4 = path.resolve(process.cwd(), 'Backend', 'uploads', path.basename(filePath));
  if (fs.existsSync(p4)) return p4;
  return p1;
};

/**
 * Helper: Call Google Gemini API with automatic model fallback
 */
const callGemini = async (prompt, apiKey) => {
  if (!apiKey) return null;
  const models = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-pro',
    'gemini-pro-latest',
  ].filter(Boolean);

  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn(`[Gemini] ${model} returned HTTP ${res.status}:`, err.error?.message || 'Error');
      }
    } catch (e) {
      console.warn(`[Gemini] ${model} network error:`, e.message);
    }
  }
  return null;
};

/**
 * Helper: Generate structured summary from PDF text
 */
const generateDocumentSummary = (docTitle, rawText) => {
  const text = cleanPdfNoise(rawText);
  const paragraphs = text.split('\n\n').map((p) => p.trim()).filter((p) => p.length > 30);
  const highlights = paragraphs.slice(0, 5).join('\n\n');

  return `### 📑 Summary of "${docTitle}"\n\n**Overview & Key Excerpts**:\n${highlights}\n\n*You can ask me specific questions about any topic in this document!*`;
};

/**
 * Helper: Generate structured response for specific concept question
 */
const generateStructuredConceptAnswer = (docTitle, userQuery, rawText) => {
  const text = cleanPdfNoise(rawText);
  const queryLower = userQuery.toLowerCase();
  const paragraphs = text.split('\n\n').map((p) => p.trim()).filter((p) => p.length > 20);

  const keywords = queryLower
    .split(/\s+/)
    .map((w) => w.replace(/[^\w]/g, ''))
    .filter((w) => w.length > 2 && !['what', 'is', 'the', 'how', 'explain', 'tell', 'about', 'can', 'you', 'give', 'does', 'with', 'from', 'for', 'advantage', 'advantages', 'over'].includes(w));

  // Rank paragraphs by keyword matches
  const scored = paragraphs.map((p) => {
    const pLower = p.toLowerCase();
    let score = 0;
    keywords.forEach((kw) => {
      if (pLower.includes(kw)) score += 1;
    });
    return { paragraph: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const bestMatch = scored.find((s) => s.score > 0) || scored[0];

  if (bestMatch && bestMatch.paragraph) {
    // Truncate to clean concise sentences
    const sentences = bestMatch.paragraph.split(/(?<=[.?!])\s+/).slice(0, 4);
    const summary = sentences.join(' ').substring(0, 600);
    return `### Key Takeaway from "${docTitle}":\n\n${summary}`;
  }

  return `### Key Takeaway from "${docTitle}":\n\nCould not locate an exact match for "${userQuery}" in this document.`;
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
    const geminiApiKey = process.env.GEMINI_API_KEY || '';

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message query string is required.',
      });
    }

    const userQuery = message.trim();

    // 1. Handle Casual Greetings
    if (isGreeting(userQuery)) {
      const userDocs = await Document.find({ uploadedBy: userId });
      const docCount = userDocs.length;
      const latestTitle = docCount > 0 ? userDocs[0].title : null;

      let greetingText = `Hello! I'm your **AiKMS Study Assistant**. 👋\n\n`;
      if (latestTitle) {
        greetingText += `I am ready to help you analyze and answer questions from your uploaded document **"${latestTitle}"**! What would you like to know?`;
      } else {
        greetingText += `Upload a PDF or study material using the sidebar button, and I'll help you query and summarize it!`;
      }

      return res.status(200).json({
        success: true,
        answer: greetingText,
        sources: latestTitle ? [latestTitle] : [],
      });
    }

    // 2. Fetch User Documents from MongoDB
    const userDocs = await Document.find({ uploadedBy: userId }).sort({ createdAt: -1 });

    if (!userDocs || userDocs.length === 0) {
      return res.status(200).json({
        success: true,
        answer: "I couldn't find any uploaded study materials in your workspace. Please upload a PDF or document using the sidebar upload button so I can answer questions directly from it!",
        sources: [],
      });
    }

    const latestDoc = userDocs[0];
    const fullPath = getExistingFilePath(latestDoc.filePath);

    // Extract raw text for intelligent text generation
    let rawDocText = '';
    if (fs.existsSync(fullPath)) {
      if (latestDoc.mimeType?.includes('pdf') || latestDoc.originalFileName?.endsWith('.pdf')) {
        rawDocText = await extractTextFromPdf(fullPath);
      } else {
        rawDocText = fs.readFileSync(fullPath, 'utf-8');
      }
    }

    // 3. Handle Summary Requests
    if (isSummaryRequest(userQuery) && rawDocText) {
      if (geminiApiKey) {
        const geminiPrompt = `You are an expert AI Study Assistant and Tutor. Provide a comprehensive, beautifully structured summary (with clear headings, bold key concepts, and bullet points) of the following study document.\n\nDOCUMENT ("${latestDoc.title}"):\n${rawDocText.substring(0, 100000)}`;
        const gAnswer = await callGemini(geminiPrompt, geminiApiKey);
        if (gAnswer) {
          return res.status(200).json({
            success: true,
            answer: gAnswer,
            sources: [latestDoc.title],
          });
        }
      }

      const summaryAnswer = generateDocumentSummary(latestDoc.title, rawDocText);
      return res.status(200).json({
        success: true,
        answer: summaryAnswer,
        sources: [latestDoc.title],
      });
    }

    // 4. Try Vector Search via ChromaDB & Embeddings
    let ragMatches = [];
    try {
      const queryVector = await generateEmbedding(userQuery);
      ragMatches = await searchVectors(userId, queryVector, 4);
    } catch (vectorErr) {
      console.warn(`[KnowledgeController] Vector RAG search fallback: ${vectorErr.message}`);
    }

    // 5. If Vector Search Returned Matches
    if (ragMatches && ragMatches.length > 0) {
      const contextTexts = ragMatches.map((m) => cleanPdfNoise(m.payload.text)).join('\n\n');
      const docIds = [...new Set(ragMatches.map((m) => m.payload.documentId))];
      const matchedDocs = await Document.find({ _id: { $in: docIds } });
      const sourceTitles = matchedDocs.map((d) => d.title);

      // Attempt Gemini API if GEMINI_API_KEY exists
      if (geminiApiKey) {
        const geminiPrompt = `You are an expert AI Study Tutor. Answer the user's question clearly, concisely, and accurately using the document context below.

Format your answer like ChatGPT:
- Use clean Markdown formatting (clear headings, bullet points, bold terms).
- Provide a clear definition/explanation first.
- Explain key concepts, issues, and solutions mentioned in the study material.

DOCUMENT CONTEXT ("${sourceTitles[0] || latestDoc.title}"):
${contextTexts}

USER QUESTION:
${userQuery}`;

        const gAnswer = await callGemini(geminiPrompt, geminiApiKey);
        if (gAnswer) {
          return res.status(200).json({
            success: true,
            answer: gAnswer,
            sources: sourceTitles,
          });
        }
      }

      // Attempt Local Ollama LLM if available
      try {
        const prompt = `System: You are an AI Study Assistant for AiKMS. Answer the user's question accurately using ONLY the provided document context below.\n\nDOCUMENT CONTEXT:\n${contextTexts}\n\nUSER QUESTION: ${userQuery}`;

        const llmRes = await fetch(`${OLLAMA_HOST}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3',
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
            });
          }
        }
      } catch (llmErr) {
        console.warn(`[KnowledgeController] Ollama LLM fallback: ${llmErr.message}`);
      }

      // Smart Structured Context Answer Fallback
      const topMatchText = cleanPdfNoise(ragMatches[0].payload.text);
      const structuredAnswer = `### 📌 Answer from "${sourceTitles[0] || latestDoc.title}"\n\n${topMatchText}`;

      return res.status(200).json({
        success: true,
        answer: structuredAnswer,
        sources: sourceTitles.length > 0 ? sourceTitles : [latestDoc.title],
      });
    }

    // 6. Direct Extraction Fallback (Supports Gemini API)
    if (rawDocText) {
      if (geminiApiKey) {
        const geminiPrompt = `You are an expert AI Study Tutor. Answer the user's question clearly, concisely, and accurately based on the document context provided below.

Format your answer like ChatGPT:
- Use clean Markdown formatting (clear headings, bullet points, and bold terms).
- Provide a clear definition/explanation first.
- Break down key concepts, issues, and solutions mentioned in the document.

DOCUMENT CONTEXT ("${latestDoc.title}"):
${rawDocText.substring(0, 100000)}

USER QUESTION:
${userQuery}`;

        const gAnswer = await callGemini(geminiPrompt, geminiApiKey);
        if (gAnswer) {
          return res.status(200).json({
            success: true,
            answer: gAnswer,
            sources: [latestDoc.title],
          });
        }
      }

      const structuredAnswer = generateStructuredConceptAnswer(latestDoc.title, userQuery, rawDocText);
      return res.status(200).json({
        success: true,
        answer: structuredAnswer,
        sources: [latestDoc.title],
      });
    }

    return res.status(200).json({
      success: true,
      answer: `I found your uploaded document "${latestDoc.title}", but could not extract readable text passages for "${userQuery}".`,
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
    console.error(`[KnowledgeController] Delete vectors error:`, error.message);
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
