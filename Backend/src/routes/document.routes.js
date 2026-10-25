import express from "express";
import { uploadDocument, getMyDocuments, deleteDocument, getDocumentStats } from "../controllers/document.controller.js";
import uploadDocumentMiddleware from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const documentRoutes = express.Router();

documentRoutes.post(
  "/upload",
  protect,
  uploadDocumentMiddleware.single("file"),
  uploadDocument
);
documentRoutes.get("/my-documents", protect, getMyDocuments);
documentRoutes.get("/:id/stats", protect, getDocumentStats);
documentRoutes.delete("/:id", protect, deleteDocument);

export default documentRoutes;