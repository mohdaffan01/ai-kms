/**
 * Service: Document Processor
 * Main orchestrator service for document text extraction, cleaning, chunking,
 * embedding generation, and ChromaDB vector store indexing.
 */

import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { cleanText } from './textCleaner.js';
import { chunkText } from './textChunker.js';
import { generateBatchEmbeddings } from './embeddingService.js';
import { upsertVectors } from './chromaService.js';
import { extractOfficeDocumentText } from './officeExtractor.js';

/**
 * Extract raw text from a PDF file using PDFParse.
 * 
 * @param {string} filePath - Absolute path to PDF file on disk
 * @returns {Promise<string>} Extracted raw text
 */
export const extractTextFromPdf = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  if (typeof parser.destroy === 'function') {
    await parser.destroy();
  }
  return result.text || '';
};

/**
 * Orchestrate the complete processing pipeline for a document:
 * Extract -> Clean -> Chunk -> Embed -> Store in ChromaDB.
 * Gracefully handles vector service offline state.
 * 
 * @param {string} filePath - File path on disk
 * @param {string} mimeType - File MIME type or extension
 * @param {string} documentId - MongoDB Document ID
 * @param {string} userId - Owner User ID
 * @returns {Promise<Object>} Processing summary result
 */
export const processDocument = async (filePath, mimeType, documentId, userId) => {
  console.log(`[DocumentProcessor] Starting processing for Document ${documentId}`);

  // 1. Text Extraction
  let rawText = '';
  if (mimeType.includes('pdf') || filePath.endsWith('.pdf')) {
    rawText = await extractTextFromPdf(filePath);
  } else if (
    filePath.endsWith('.pptx') ||
    filePath.endsWith('.ppt') ||
    filePath.endsWith('.docx') ||
    filePath.endsWith('.doc') ||
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('word') ||
    mimeType.includes('officedocument')
  ) {
    rawText = extractOfficeDocumentText(filePath, mimeType);
    if (!rawText) {
      rawText = fs.readFileSync(filePath, 'utf-8');
    }
  } else {
    // Basic text file reading fallback for .txt, .md
    rawText = fs.readFileSync(filePath, 'utf-8');
  }

  if (!rawText || !rawText.trim()) {
    throw new Error('Extracted text is empty or unreadable');
  }

  // 2. Clean Extracted Text
  const cleanedText = cleanText(rawText);

  // 3. Split Text into Chunks
  const chunks = chunkText(cleanedText, { chunkSize: 800, chunkOverlap: 100 });

  if (chunks.length === 0) {
    throw new Error('No chunks generated from document text');
  }

  // 4. Try Vector Embedding Generation & ChromaDB Storage
  let vectorized = false;
  try {
    const embeddedChunks = await generateBatchEmbeddings(chunks);

    const points = embeddedChunks.map((item, index) => {
      const pointId = `${documentId}_${index}`;
      return {
        id: pointId,
        vector: item.embedding,
        payload: {
          userId: userId.toString(),
          documentId: documentId.toString(),
          chunkIndex: item.chunkIndex,
          text: item.text,
          charCount: item.charCount,
          createdAt: new Date().toISOString(),
        },
      };
    });

    await upsertVectors(points);
    vectorized = true;
    console.log(`[DocumentProcessor] Successfully vectorized Document ${documentId} (${chunks.length} chunks)`);
  } catch (vecErr) {
    console.warn(`[DocumentProcessor] Vector embedding skipped for Document ${documentId} (${vecErr.message}). Text extraction & fallback Q&A available.`);
  }

  return {
    success: true,
    documentId,
    vectorized,
    totalChunks: chunks.length,
    totalCharacters: cleanedText.length,
  };
};

export default {
  extractTextFromPdf,
  processDocument,
};
