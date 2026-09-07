import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { authRoutes, userRoutes } from './routes/user.routes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// API Routes
app.get('/', (req, res) => {
  res.json({ message: 'AiKMS API Server is running smoothly' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AiKMS Backend Server running on port ${PORT}`);
});
