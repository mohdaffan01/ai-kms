import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory always exists on any machine/clone
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
//storage configuration for multer to specify where and how files should be stored when uploaded
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads", { recursive: true });
    }
    cb(null, "uploads/");//cb(null, "uploads/") specifies the destination folder for uploaded files. The first argument is an error (null means no error), and the second argument is the destination path.
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

//filefilter = function that checks the file type and extension of the uploaded file to ensure it matches the allowed types. If the file is valid, it calls the callback with true; otherwise, it calls the callback with an error message.
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