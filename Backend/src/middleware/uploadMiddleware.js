import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory always exists on any machine/clone
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads", { recursive: true });
    }
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname).toLowerCase();

    cb(null, `${uniqueName}${extension}`);
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
];

const allowedExtensions = [
  ".pdf",
  ".ppt",
  ".pptx",
  ".doc",
  ".docx",
  ".txt",
  ".md",
];

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const isAllowed =
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(extension);

  if (isAllowed) {
    return cb(null, true);
  }
  //cb = callback function used to pass values to the next middleware or the route handler
  cb(
    new Error(
      "Only PDF, PPT, PPTX, DOC, DOCX, TXT, and Markdown files are allowed."
    )
  );
};

const uploadDocumentMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, //20MB 
  },
});

export default uploadDocumentMiddleware;