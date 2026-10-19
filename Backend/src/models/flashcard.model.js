import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
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
    subjectId: {
      type: String,
      default: '',
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subtopic: {
      type: String,
      default: '',
      trim: true,
    },
    front: {
      type: String,
      required: true,
      trim: true,
    },
    back: {
      type: String,
      required: true,
      trim: true,
    },
    hint: {
      type: String,
      default: '',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    isMastered: {
      type: Boolean,
      default: false,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    lastReviewedAt: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      enum: ['ai-generated', 'custom', 'extracted'],
      default: 'ai-generated',
    },
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

flashcardSchema.index({ userId: 1, subject: 1, isMastered: 1 });

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

export default Flashcard;
