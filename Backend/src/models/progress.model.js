import mongoose from 'mongoose';

const subtopicSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
});

const topicSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  isUserCreated: {
    type: Boolean,
    default: false,
  },
  isExtracted: {
    type: Boolean,
    default: false,
  },
  subtopics: [subtopicSchema],
});

const subjectSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    default: '',
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  category: {
    type: String,
    default: 'Computer Science',
    trim: true,
  },
  icon: {
    type: String,
    default: 'BookOpen',
  },
  color: {
    type: String,
    default: '#10a37f',
  },
  topics: [topicSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const activitySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'topic_completed',
      'topic_uncompleted',
      'note_added',
      'doc_uploaded',
      'subject_created',
      'study_session',
      'quiz_completed',
      'flashcard_review',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    default: '',
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    subjects: [subjectSchema],
    recentActivities: [activitySchema],
  },
  {
    timestamps: true,
  }
);

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
