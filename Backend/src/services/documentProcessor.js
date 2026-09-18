/**
 * Service: Document Processor
 * Main orchestrator service for document text extraction, cleaning, chunking,
 * embedding generation, and Qdrant vector store indexing.
 */

import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { cleanText } from './textCleaner.js';
import { chunkText } from './textChunker.js';
import { generateBatchEmbeddings } from './embeddingService.js';
import { upsertVectors } from './qdrantService.js';

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
 * Extract -> Clean -> Chunk -> Embed -> Store in Qdrant.
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
  } else {
    // Basic text file reading fallback for .txt, .md
    rawText = fs.readFileSync(filePath, 'utf-8');
  }

  if (!rawText.trim()) {
    throw new Error('Extracted text is empty');
  }

  // 2. Clean Extracted Text
  const cleanedText = cleanText(rawText);

  // 3. Split Text into Chunks
  const chunks = chunkText(cleanedText, { chunkSize: 800, chunkOverlap: 100 });

  if (chunks.length === 0) {
    throw new Error('No chunks generated from document text');
  }

  // 4. Generate Embeddings for Chunks
  const embeddedChunks = await generateBatchEmbeddings(chunks);

  // 5. Prepare Qdrant Points with Payload Metadata
  const points = embeddedChunks.map((item, index) => {
    // Generate deterministic UUID/string point ID
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

  // 6. Store Points in Qdrant
  await upsertVectors(points);

  console.log(`[DocumentProcessor] Successfully processed Document ${documentId} (${chunks.length} chunks indexed)`);

  return {
    success: true,
    documentId,
    totalChunks: chunks.length,
    totalCharacters: cleanedText.length,
  };
};

export default {
  extractTextFromPdf,
  processDocument,
};
