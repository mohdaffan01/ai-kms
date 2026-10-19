import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [
      (val) => Array.isArray(val) && val.length >= 2,
      'A question must have at least 2 options.',
    ],
  },
  correctAnswer: {
    type: Number, // 0-based index into options array
    required: true,
  },
  explanation: {
    type: String,
    required: true,
    trim: true,
  },
  topic: {
    type: String,
    default: 'General',
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
});

const quizAttemptSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  selectedAnswers: [
    {
      questionIndex: Number,
      selectedOption: Number,
      isCorrect: Boolean,
    },
  ],
  timeSpentSeconds: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

const quizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      default: 'All Completed Topics',
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'mixed',
    },
    questions: [questionSchema],
    totalQuestions: {
      type: Number,
      required: true,
    },
    bestScore: {
      type: Number,
      default: null,
    },
    bestPercentage: {
      type: Number,
      default: null,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    attempts: [quizAttemptSchema],
    sourceDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ userId: 1, subject: 1, createdAt: -1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
