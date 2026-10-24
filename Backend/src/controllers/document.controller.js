import fs from "fs";
import path from "path";
import { documentRepository } from "../repositories/document.repository.js";
import { progressRepository } from "../repositories/progress.repository.js";
import { extractTopicsFromDocument } from "../services/topicExtractor.service.js";
import { clearDocumentCache } from "./knowledge.controller.js";

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

    const document = await documentRepository.create({
      title,
      contentType: "file",
      originalFileName: req.file.originalname,
      filePath: `uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
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