import fs from "fs";
import path from "path";
import Document from "../models/document.model.js";

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

    const document = await Document.create({
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
      uploadedBy: req.user._id || req.user.id,

      processingStatus: "uploaded",
    });

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

    const documents = await Document.find(filter).sort({
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

    const document = await Document.findById(id);

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
        const fullPath = path.resolve(document.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (fsErr) {
        console.warn("Could not delete file from disk:", fsErr.message);
      }
    }

    // Delete document record from MongoDB
    await Document.findByIdAndDelete(id);

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