import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // "file" for uploaded documents; "note" for personal notes
    contentType: {
      type: String,
      enum: ["file", "note"],
      required: true,
    },

    originalFileName: {
      type: String,
      default: null,
    },

    filePath: {
      type: String,
      default: null,
    },

    mimeType: {
      type: String,
      default: null,
    },

    fileSize: {
      type: Number,
      default: null,
    },

    // Used only when contentType is "note"
    noteContent: {
      type: String,
      default: null,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    topic: {
      type: String,
      default: "",
      trim: true,
    },

    folder: {
      type: String,
      default: "General",
      trim: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Module 3 will update this after vector indexing
    processingStatus: {
      type: String,
      enum: ["uploaded", "processing", "ready", "failed"],
      default: "uploaded",
    },

    processingError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model("Document", documentSchema);
export default Document;