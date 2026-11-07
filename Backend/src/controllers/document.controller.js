import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { documentRepository } from "../repositories/document.repository.js";
import { progressRepository } from "../repositories/progress.repository.js";
import { extractTopicsFromDocument } from "../services/topicExtractor.service.js";
import { clearDocumentCache } from "./knowledge.controller.js";

/**
 * Resolves the statistics (pageCount, wordCount, lineCount) of a document file.
 * Defaults to 1 page for text/note files and extracts pages, words, and lines from text.
 */
export const resolveDocumentStats = async (filePath, mimeType = '', originalFileName = '', noteContent = null) => {
  let pageCount = 1;
  let wordCount = 0;
  let lineCount = 0;
  let charCount = 0;

  if (noteContent) {
    const cleanText = (noteContent || '').trim();
    charCount = cleanText.length;
    wordCount = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    lineCount = cleanText ? cleanText.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0).length : 0;
    return { pageCount: 1, wordCount, lineCount, charCount };
  }

  if (!filePath) return { pageCount: 1, wordCount: 0, lineCount: 0, charCount: 0 };

  const isPdf = mimeType?.includes('pdf') || originalFileName?.toLowerCase().endsWith('.pdf');

  try {
    const fullPath = path.isAbsolute(filePath) && fs.existsSync(filePath)
      ? filePath
      : (fs.existsSync(path.resolve(process.cwd(), filePath))
          ? path.resolve(process.cwd(), filePath)
          : path.resolve(process.cwd(), 'Backend', filePath));

    if (fs.existsSync(fullPath)) {
      if (isPdf) {
        const buffer = fs.readFileSync(fullPath);
        const parser = new PDFParse({ data: buffer });
        const resParsed = await parser.getText();
        pageCount = resParsed.total || (Array.isArray(resParsed.pages) ? resParsed.pages.length : null) || 1;
        const text = (resParsed.text || '').trim();
        if (text) {
          charCount = text.length;
          wordCount = text.split(/\s+/).filter(Boolean).length;
          lineCount = text.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0).length;
        }
        if (typeof parser.destroy === 'function') await parser.destroy();

        // Fallback regex detection on PDF binary if pageCount couldn't be determined
        if (!pageCount || pageCount === 1) {
          const latinText = buffer.toString('latin1');
          const countMatch = latinText.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
          if (countMatch && countMatch[1]) {
            pageCount = parseInt(countMatch[1], 10);
          } else {
            const pageMatches = latinText.match(/\/Type\s*\/Page\b/g);
            if (pageMatches && pageMatches.length > 0) {
              pageCount = pageMatches.length;
            }
          }
        }
      } else {
        const text = fs.readFileSync(fullPath, 'utf-8').trim();
        charCount = text.length;
        wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
        lineCount = text ? text.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0).length : 0;
        pageCount = 1;
      }
    }
  } catch (err) {
    console.warn('[resolveDocumentStats] Could not extract document statistics:', err.message);
  }

  return {
    pageCount: pageCount || 1,
    wordCount: wordCount || 0,
    lineCount: lineCount || 0,
    charCount: charCount || 0,
  };
};

export const resolveDocumentPageCount = async (filePath, mimeType = '', originalFileName = '') => {
  const stats = await resolveDocumentStats(filePath, mimeType, originalFileName);
  return stats.pageCount;
};

//----------------upload document--------------------
export const uploadDocument = async (req, res) => {
  try {
    const { title, subject, topic, folder } = req.body;

    // Multer places the uploaded file inside req.file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a valid document file.",
      });
    }

    if (!title || !subject) {
      return res.status(400).json({
        success: false,
        message: "Title and subject are required.",
      });
    }

    const userId = req.user._id || req.user.id;

    // Extract document stats (pages, words, lines, character count)
    const { pageCount, wordCount, lineCount, charCount } = await resolveDocumentStats(
      req.file.path,
      req.file.mimetype,
      req.file.originalname
    );

    // Validation: Block blank documents if text is shorter than 3 characters
    if (!charCount || charCount < 3) {
      // Remove temporary uploaded file from disk to prevent storage clutter
      try {
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (unlinkErr) {
        console.warn('[uploadDocument] Could not remove rejected blank file:', unlinkErr.message);
      }

      return res.status(400).json({
        success: false,
        message: "This document is blank or contains less than 3 characters of readable text. Please upload a document with valid study material.",
      });
    }

    const document = await documentRepository.create({
      title,
      contentType: "file",
      originalFileName: req.file.originalname,
      filePath: `uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      pageCount,
      wordCount,
      lineCount,
      subject,
      topic: topic || "",
      folder: folder || "General",

      // This comes from your JWT auth middleware
      uploadedBy: userId,

      processingStatus: "uploaded",
    });

    // Auto-extract study topics from uploaded document into Progress index
    try {
      const extractedChapters = await extractTopicsFromDocument(document);
      let progress = await progressRepository.findByUserId(userId);

      if (progress) {
        let subj = progress.subjects.find(
          (s) => s.name.trim().toLowerCase() === subject.trim().toLowerCase()
        );

        if (!subj) {
          subj = {
            id: `sub-${Date.now().toString(36)}`,
            name: subject.trim(),
            code: "",
            description: `Generated from ${title}`,
            category: "Coursework",
            icon: "BookOpen",
            color: "#10a37f",
            topics: [],
            createdAt: new Date(),
          };
          progress.subjects.push(subj);
        }

        const existingParentNames = new Set((subj.topics || []).map((t) => t.name.toLowerCase()));
        let totalItemsAdded = 0;

        extractedChapters.forEach((chap, pIdx) => {
          const chapName = typeof chap === "string" ? chap.trim() : (chap.name ? chap.name.trim() : "");
          if (!chapName) return;

          const chapLower = chapName.toLowerCase();
          const subNames = Array.isArray(chap.subtopics) ? chap.subtopics : [];

          if (!existingParentNames.has(chapLower)) {
            existingParentNames.add(chapLower);

            const formattedSubtopics = subNames.map((sName, sIdx) => ({
              id: `subtop-${subj.id}-${pIdx + 1}-${sIdx + 1}-${Date.now().toString(36)}`,
              name: typeof sName === "string" ? sName.trim() : sName.name,
              completed: false,
              completedAt: null,
            }));

            subj.topics.push({
              id: `top-${subj.id}-${Date.now().toString(36)}-${pIdx}`,
              name: chapName,
              completed: false,
              completedAt: null,
              isExtracted: true,
              subtopics: formattedSubtopics,
            });

            totalItemsAdded += formattedSubtopics.length > 0 ? formattedSubtopics.length : 1;
          } else {
            // Chapter exists, merge any new subtopics
            const existingParent = subj.topics.find((t) => t.name.toLowerCase() === chapLower);
            if (existingParent) {
              if (!existingParent.subtopics) existingParent.subtopics = [];
              const existingSubNames = new Set(existingParent.subtopics.map((st) => st.name.toLowerCase()));

              subNames.forEach((sName, sIdx) => {
                const cleanSName = typeof sName === "string" ? sName.trim() : sName.name;
                if (cleanSName && !existingSubNames.has(cleanSName.toLowerCase())) {
                  existingSubNames.add(cleanSName.toLowerCase());
                  existingParent.subtopics.push({
                    id: `subtop-${subj.id}-${Date.now().toString(36)}-${sIdx}`,
                    name: cleanSName,
                    completed: false,
                    completedAt: null,
                  });
                  totalItemsAdded++;
                }
              });
            }
          }
        });

        // Add recent activity
        progress.recentActivities.unshift({
          id: `act-doc-${Date.now()}`,
          type: "doc_uploaded",
          title: `Uploaded "${title}" (${totalItemsAdded} study topics indexed for ${subject})`,
          subject: subject.trim(),
          timestamp: new Date(),
        });

        await progress.save();
      }
    } catch (extractErr) {
      console.warn("[UploadDocument] Automatic topic extraction warning:", extractErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully.",
      document,
    });
  } catch (error) {
    console.error("Document upload error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not upload the document.",
    });
  }
}; 

// -------------------------get Documents ------------------------------
export const getMyDocuments = async (req, res) => {
  try {
    const { subject, topic, folder } = req.query;

    const filter = {
      uploadedBy: req.user._id || req.user.id,
    };

    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (folder) filter.folder = folder;

    const documents = await documentRepository.find(filter).sort({
      createdAt: -1,
    });

    // Backfill stats for existing documents if not yet populated
    for (const doc of documents) {
      if (
        doc.pageCount === null ||
        doc.pageCount === undefined ||
        doc.wordCount === null ||
        doc.wordCount === undefined ||
        doc.lineCount === null ||
        doc.lineCount === undefined
      ) {
        const stats = await resolveDocumentStats(
          doc.filePath,
          doc.mimeType,
          doc.originalFileName,
          doc.noteContent
        );
        doc.pageCount = stats.pageCount;
        doc.wordCount = stats.wordCount;
        doc.lineCount = stats.lineCount;
        documentRepository
          .findByIdAndUpdate(doc._id, {
            pageCount: stats.pageCount,
            wordCount: stats.wordCount,
            lineCount: stats.lineCount,
          })
          .catch(() => {});
      }
    }

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get documents error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch documents.",
    });
  }
};

// ------------------------- Delete Document ------------------------------
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await documentRepository.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    // Ownership check
    const userId = req.user._id ? req.user._id.toString() : req.user.id.toString();
    if (document.uploadedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this document.",
      });
    }

    // Attempt file system deletion if present
    if (document.filePath) {
      try {
        const fullPath = path.isAbsolute(document.filePath) && fs.existsSync(document.filePath)
          ? document.filePath
          : (fs.existsSync(path.resolve(process.cwd(), document.filePath))
              ? path.resolve(process.cwd(), document.filePath)
              : path.resolve(process.cwd(), 'Backend', document.filePath));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (fsErr) {
        console.warn("Could not delete file from disk:", fsErr.message);
      }
    }

    // Delete document record from MongoDB
    await documentRepository.findByIdAndDelete(id);
    clearDocumentCache(id);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully.",
    });
  } catch (error) {
    console.error("Delete document error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not delete document.",
    });
  }
};

// ------------------------- Get Document Stats ---------------------------
export const getDocumentStats = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await documentRepository.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    if (
      document.pageCount &&
      document.wordCount !== null &&
      document.wordCount !== undefined &&
      document.lineCount !== null &&
      document.lineCount !== undefined
    ) {
      return res.status(200).json({
        success: true,
        stats: {
          pageCount: document.pageCount,
          wordCount: document.wordCount,
          lineCount: document.lineCount,
        },
      });
    }

    const stats = await resolveDocumentStats(
      document.filePath,
      document.mimeType,
      document.originalFileName,
      document.noteContent
    );

    document.pageCount = stats.pageCount;
    document.wordCount = stats.wordCount;
    document.lineCount = stats.lineCount;
    await document.save();

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get document stats error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not calculate document stats.",
    });
  }
};