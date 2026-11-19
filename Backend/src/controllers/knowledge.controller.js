import { documentRepository } from '../repositories/document.repository.js';
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
    const document = await documentRepository.findById(documentId);

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
        await documentRepository.updateProcessingStatus(req.params.documentId, 'failed');
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
const callGemini = async (prompt, apiKey, preferredModel = null) => {
  if (!apiKey) return null;
  const models = [
    preferredModel,
    process.env.MODEL_CHAT,
    process.env.MODEL_SUMMARIZATION,
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
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

// In-memory text cache to prevent re-reading/re-parsing PDFs on every single chat message
const documentTextCache = new Map();

/**
 * Clear text cache for a specific document or entire cache
 */
export const clearDocumentCache = (documentId = null) => {
  if (!documentId) {
    documentTextCache.clear();
    return;
  }
  for (const key of documentTextCache.keys()) {
    if (key.startsWith(`${documentId}_`)) {
      documentTextCache.delete(key);
    }
  }
};

/**
 * Helper: Retrieve cleaned text from document file with in-memory caching
 */
export const getDocumentTextCached = async (doc) => {
  if (!doc || !doc.filePath) return '';
  const docId = (doc._id || doc.id).toString();
  const absPath = getExistingFilePath(doc.filePath);
  if (!fs.existsSync(absPath)) return '';

  try {
    const stat = fs.statSync(absPath);
    const cacheKey = `${docId}_${stat.mtimeMs}`;

    if (documentTextCache.has(cacheKey)) {
      return documentTextCache.get(cacheKey);
    }

    let text = '';
    if (doc.mimeType?.includes('pdf') || absPath.endsWith('.pdf')) {
      text = await extractTextFromPdf(absPath);
    } else {
      text = fs.readFileSync(absPath, 'utf-8');
    }

    const cleaned = cleanPdfNoise(text);
    // Limit cache size to 40 documents
    if (documentTextCache.size > 40) {
      const firstKey = documentTextCache.keys().next().value;
      if (firstKey) documentTextCache.delete(firstKey);
    }
    documentTextCache.set(cacheKey, cleaned);
    return cleaned;
  } catch (err) {
    console.warn(`[KnowledgeController] Failed to extract text for "${doc.title}":`, err.message);
    return '';
  }
};

/**
 * Helper: Find relevant passages from a document text for a given user query
 */
const findRelevantPassagesFromDoc = (doc, docText, userQuery, maxPassages = 4) => {
  if (!docText || !docText.trim()) return { score: 0, passages: [] };

  const queryLower = userQuery.toLowerCase();
  const docTitleLower = (doc.title || '').toLowerCase();
  const docSubjectLower = (doc.subject || '').toLowerCase();
  const docTopicLower = (doc.topic || '').toLowerCase();

  // Stop words to exclude from keyword extraction
  const stopWords = new Set([
    'what', 'is', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or',
    'how', 'why', 'can', 'you', 'explain', 'tell', 'me', 'about', 'give', 'does',
    'from', 'with', 'which', 'by', 'this', 'that', 'these', 'those', 'kya', 'hai',
    'btao', 'kese', 'kaise', 'batao', 'mai', 'se', 'ko', 'aur', 'hi', 'bhi', 'doc',
    'document', 'file', 'pdf', 'notes', 'answer', 'question'
  ]);

  const rawKeywords = queryLower
    .split(/[\s,?.!:;()"'`]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !stopWords.has(w));

  let docBaseScore = 0;

  // Title / Subject / Topic exact match bonus
  if (docTitleLower && queryLower.includes(docTitleLower)) docBaseScore += 60;
  if (docSubjectLower && queryLower.includes(docSubjectLower)) docBaseScore += 45;
  if (docTopicLower && queryLower.includes(docTopicLower)) docBaseScore += 35;

  // Check individual words in title / subject
  rawKeywords.forEach((kw) => {
    if (docTitleLower.includes(kw)) docBaseScore += 20;
    if (docSubjectLower.includes(kw)) docBaseScore += 15;
  });

  // Break text into paragraphs / chunks
  const paragraphs = docText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 25);

  const scoredParagraphs = paragraphs.map((para) => {
    const pLower = para.toLowerCase();
    let pScore = 0;

    rawKeywords.forEach((kw) => {
      if (pLower.includes(kw)) {
        // Count occurrences
        const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
        const count = (pLower.match(regex) || []).length;
        pScore += Math.max(1, count) * 8 + 4;
      }
    });

    return { paragraph: para, score: pScore };
  });

  scoredParagraphs.sort((a, b) => b.score - a.score);

  const topScored = scoredParagraphs.filter((p) => p.score > 0).slice(0, maxPassages);
  const totalParagraphScore = topScored.reduce((sum, p) => sum + p.score, 0);

  const totalScore = docBaseScore + totalParagraphScore;

  // If no keywords matched any paragraph, still provide the top introduction paragraphs if title/subject matched
  let finalPassages = topScored.map((p) => p.paragraph);
  if (finalPassages.length === 0 && (docBaseScore > 0 || paragraphs.length > 0)) {
    finalPassages = paragraphs.slice(0, 2);
  }

  return {
    score: totalScore,
    passages: finalPassages,
  };
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
 * @desc    RAG Chat Query API - Answers user question grounded in uploaded PDF/document content
 *          Intelligently searches across ALL user documents or a selected document
 * @route   POST /api/knowledge/chat
 * @access  Private
 */
export const queryRagChat = async (req, res) => {
  try {
    const { message, documentId, subject } = req.body;
    const userId = req.user._id || req.user.id;
    const geminiApiKey = process.env.GEMINI_API_KEY || '';

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message query string is required.',
      });
    }

    const userQuery = message.trim();

    // 1. Fetch ALL User Documents from MongoDB
    const userDocs = await documentRepository.findUserDocuments(userId);

    if (!userDocs || userDocs.length === 0) {
      return res.status(200).json({
        success: true,
        answer: "I couldn't find any uploaded study materials in your workspace. Please upload a PDF or document using the sidebar upload button so I can answer questions directly from it!",
        sources: [],
      });
    }

    // Determine target documents (Specific Subject, Specific document, or ALL documents)
    let targetDocs = userDocs;
    if (subject && subject !== 'all') {
      const bySubject = userDocs.filter(
        (d) => d.subject && d.subject.trim().toLowerCase() === subject.trim().toLowerCase()
      );
      if (bySubject.length > 0) {
        targetDocs = bySubject;
      }
    } else if (documentId && documentId !== 'all') {
      const selected = userDocs.filter((d) => d._id.toString() === documentId.toString());
      if (selected.length > 0) {
        targetDocs = selected;
      }
    }

    // 2. Handle Casual Greetings
    if (isGreeting(userQuery)) {
      const docTitles = userDocs.map((d) => `"${d.title}" (${d.subject || 'Coursework'})`);
      let greetingText = `Hello! I'm your **AiKMS Study Assistant**. 👋\n\n`;
      if (docTitles.length === 1) {
        greetingText += `I am ready to help you analyze and answer questions from your uploaded document **${docTitles[0]}**! What would you like to know?`;
      } else {
        greetingText += `I have access to all **${docTitles.length} study documents** in your workspace:\n${docTitles.map((t) => `- ${t}`).join('\n')}\n\nYou can ask me questions about any of these files or topics!`;
      }

      return res.status(200).json({
        success: true,
        answer: greetingText,
        sources: userDocs.map((d) => d.title),
      });
    }

    // 3. Handle Summary Requests
    if (isSummaryRequest(userQuery)) {
      let docToSummarize = targetDocs[0];
      const queryLower = userQuery.toLowerCase();

      // Check if user specifically mentioned any document title or subject
      const namedDoc = userDocs.find(
        (d) =>
          (d.title && queryLower.includes(d.title.toLowerCase())) ||
          (d.subject && queryLower.includes(d.subject.toLowerCase()))
      );

      if (namedDoc) {
        docToSummarize = namedDoc;
      }

      const docText = await getDocumentTextCached(docToSummarize);
      if (docText) {
        if (geminiApiKey) {
          const geminiPrompt = `You are an expert AI Study Assistant and Tutor. Provide a comprehensive, beautifully structured summary (with clear headings, bold key concepts, and bullet points) of the following study document.\n\nDOCUMENT ("${docToSummarize.title}" - Subject: ${docToSummarize.subject || 'General'}):\n${docText.substring(0, 80000)}`;
          const gAnswer = await callGemini(geminiPrompt, geminiApiKey, process.env.MODEL_SUMMARIZATION || 'gemini-3.5-flash-lite');
          if (gAnswer) {
            return res.status(200).json({
              success: true,
              answer: gAnswer,
              sources: [docToSummarize.title],
            });
          }
        }

        const summaryAnswer = generateDocumentSummary(docToSummarize.title, docText);
        return res.status(200).json({
          success: true,
          answer: summaryAnswer,
          sources: [docToSummarize.title],
        });
      }
    }

    // 4. Try Vector Search via ChromaDB & Embeddings across user's documents
    let ragMatches = [];
    try {
      const queryVector = await generateEmbedding(userQuery);
      ragMatches = await searchVectors(userId, queryVector, 8);
      if (documentId && documentId !== 'all') {
        ragMatches = ragMatches.filter(
          (m) => m.payload?.documentId === documentId.toString()
        );
      }
    } catch (vectorErr) {
      console.warn(`[KnowledgeController] Vector RAG search fallback: ${vectorErr.message}`);
    }

    // 5. If Vector Search Returned Good Matches
    if (ragMatches && ragMatches.length > 0 && ragMatches.some((m) => m.score > 0.05)) {
      const docIds = [...new Set(ragMatches.map((m) => m.payload.documentId))];
      const matchedDocs = await documentRepository.findDocumentsByIds(docIds);
      const docMap = new Map(matchedDocs.map((d) => [d._id.toString(), d]));
      const sourceTitles = matchedDocs.map((d) => d.title);

      const contextTexts = ragMatches
        .map((m) => {
          const d = docMap.get(m.payload.documentId);
          const header = d ? `[From Document: "${d.title}" (${d.subject || 'Coursework'})]:` : '';
          return `${header}\n${cleanPdfNoise(m.payload.text)}`;
        })
        .join('\n\n');

      if (geminiApiKey) {
        const geminiPrompt = `You are an expert AI Study Tutor. Answer the user's question clearly, concisely, and accurately using the document context below.
If context comes from different documents, clearly attribute the concepts to their respective source documents.

Format your answer like ChatGPT:
- Use clean Markdown formatting (clear headings, bullet points, bold terms).
- Provide a clear definition/explanation first.
- Explain key concepts, issues, and solutions mentioned in the study material.

DOCUMENT CONTEXT:
${contextTexts}

USER QUESTION:
${userQuery}`;

        const gAnswer = await callGemini(geminiPrompt, geminiApiKey, process.env.MODEL_CHAT || 'gemini-3.5-flash-lite');
        if (gAnswer) {
          return res.status(200).json({
            success: true,
            answer: gAnswer,
            sources: sourceTitles,
          });
        }
      }

      // Ollama LLM fallback if available
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

      // Smart Structured Context Answer Fallback from vector match
      const topMatch = ragMatches[0];
      const matchedDocObj = docMap.get(topMatch.payload.documentId);
      const docLabel = matchedDocObj ? matchedDocObj.title : (sourceTitles[0] || 'Uploaded Document');
      const topMatchText = cleanPdfNoise(topMatch.payload.text);
      const structuredAnswer = `### 📌 Answer from "${docLabel}"\n\n${topMatchText}`;

      return res.status(200).json({
        success: true,
        answer: structuredAnswer,
        sources: sourceTitles.length > 0 ? sourceTitles : [docLabel],
      });
    }

    // 6. Intelligent Multi-Document Search & Text Matching Fallback
    // Evaluates ALL user documents (or selected document) to find the exact file matching the query
    const scoredDocs = [];
    for (const doc of targetDocs) {
      const text = await getDocumentTextCached(doc);
      if (text && text.trim()) {
        const { score, passages } = findRelevantPassagesFromDoc(doc, text, userQuery);
        scoredDocs.push({
          doc,
          text,
          score,
          passages,
        });
      }
    }

    if (scoredDocs.length === 0) {
      return res.status(200).json({
        success: true,
        answer: "None of your uploaded documents could be parsed for readable text. Please check the uploaded files.",
        sources: [],
      });
    }

    // Sort documents by relevance score to the query
    scoredDocs.sort((a, b) => b.score - a.score);

    // Pick top matching documents (if one or more have relevant keyword hits)
    const matchingDocs = scoredDocs.filter((d) => d.score > 0);
    const primaryDocs = matchingDocs.length > 0 ? matchingDocs.slice(0, 2) : [scoredDocs[0]];

    const primaryDoc = primaryDocs[0].doc;
    const sources = primaryDocs.map((d) => d.doc.title);

    // Build rich multi-document context passages
    const contextSections = primaryDocs
      .map((d) => {
        const passageText =
          d.passages && d.passages.length > 0
            ? d.passages.join('\n\n')
            : d.text.substring(0, 5000);
        return `--- Document: "${d.doc.title}" (Subject: ${d.doc.subject || 'General'}) ---\n${passageText}`;
      })
      .join('\n\n');

    // Attempt Gemini API with multi-document context
    if (geminiApiKey) {
      const geminiPrompt = `You are an expert AI Study Tutor. Answer the user's question clearly, concisely, and accurately based on the document context provided below.
The student has multiple study documents uploaded in their workspace. The relevant document(s) matching their question have been identified and provided below.

Rules:
1. Ground your answer in the provided document context.
2. If the user asked about a specific topic from one of the files, identify and explain it clearly with reference to that file.
3. Format your answer like ChatGPT: clean Markdown with bold terms, headings, and bullet points.
4. If the query cannot be answered from the document context, say what the document discusses instead of hallucinating.

DOCUMENT CONTEXT:
${contextSections.substring(0, 35000)}

USER QUESTION:
${userQuery}`;

      const gAnswer = await callGemini(geminiPrompt, geminiApiKey, process.env.MODEL_CHAT || 'gemini-3.5-flash-lite');
      if (gAnswer) {
        return res.status(200).json({
          success: true,
          answer: gAnswer,
          sources,
        });
      }
    }

    // Local / Heuristic Structured Concept Answer Fallback
    const bestPassage =
      primaryDocs[0].passages && primaryDocs[0].passages[0]
        ? primaryDocs[0].passages[0]
        : primaryDocs[0].text.substring(0, 600);
    const structuredAnswer = `### 📌 Answer from "${primaryDoc.title}" (${primaryDoc.subject || 'Coursework'}):\n\n${bestPassage}`;

    return res.status(200).json({
      success: true,
      answer: structuredAnswer,
      sources,
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

    const document = await documentRepository.findById(documentId);
    if (document && document.uploadedBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this document vectors' });
    }

    // Delete vectors from ChromaDB
    await deleteVectorsByDocument(documentId);
    clearDocumentCache(documentId);

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
