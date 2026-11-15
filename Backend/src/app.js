import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { authRoutes, userRoutes } from './routes/user.routes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import documentRoutes from "./routes/document.routes.js";
import knowledgeRoutes from "./routes/knowledge.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import flashcardRoutes from "./routes/flashcard.routes.js";
import quizRoutes from "./routes/quiz.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// Ensure uploads directory always exists on any machine
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Makes files inside Backend/uploads publicly viewable/downloadable
app.use("/uploads", express.static("uploads"));

// API Routes
app.get('/', (req, res) => {
  res.json({ message: 'AiKMS API Server is running smoothly' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/quizzes", quizRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
