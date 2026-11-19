import fs from 'fs';
import path from 'path';
import { quizRepository } from '../repositories/quiz.repository.js';
import { documentRepository } from '../repositories/document.repository.js';
import { progressRepository } from '../repositories/progress.repository.js';
import { extractTextFromPdf } from '../services/documentProcessor.js';
import { cleanText } from '../services/textCleaner.js';
import { getExistingFilePath } from './knowledge.controller.js';

/**
 * Helper: Call Google Gemini API with fallback models
 */
const callGemini = async (prompt, apiKey) => {
  if (!apiKey) return null;
  const models = [
    process.env.MODEL_QUIZ,
    'gemma-4-26b-a4b-it',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
  ].filter(Boolean);

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn(`[Gemini Quiz] ${model} returned HTTP ${res.status}:`, err.error?.message || 'Error');
      }
    } catch (e) {
      console.warn(`[Gemini Quiz] ${model} network error:`, e.message);
    }
  }
  return null;
};

/**
 * Helper: Safely parse JSON array of questions from AI response
 */
const parseAiQuizJson = (rawAiText) => {
  if (!rawAiText) return null;
  try {
    let cleaned = rawAiText.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/g, '').trim();

    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) =>
          item &&
          item.question &&
          Array.isArray(item.options) &&
          item.options.length >= 2 &&
          typeof item.correctAnswer === 'number'
      );
    }
    return null;
  } catch (err) {
    console.warn('[QuizController] Failed to parse AI Quiz JSON:', err.message);
    return null;
  }
};

/**
 * Heuristic Extractor Fallback: Generates questions directly from document text when Gemini is offline
 */
const generateHeuristicQuiz = (subjectName, topicNames, rawText, count = 5) => {
  const questions = [];
  const text = cleanText(rawText || '');
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 50 && p.length < 800);

  const targetTopics = topicNames && topicNames.length > 0 ? topicNames : [subjectName];

  for (let i = 0; i < targetTopics.length && questions.length < count; i++) {
    const topic = targetTopics[i];
    const para = paragraphs[i % paragraphs.length] || '';

    const firstSentence = para.split(/(?<=[.?!])\s+/)[0] || '';
    const defKeyword = firstSentence.length > 20 ? firstSentence : `${topic} is a core foundation of ${subjectName}.`;

    questions.push({
      question: `Which of the following statements best describes the primary purpose of ${topic} in ${subjectName}?`,
      options: [
        defKeyword,
        `It is solely used to format peripheral hardware devices in ${subjectName}.`,
        `It operates exclusively as an operating system interrupt handler.`,
        `It acts as an external legacy compiler deprecated in modern architectures.`,
      ],
      correctAnswer: 0,
      explanation: `${topic} is designed specifically for: "${defKeyword}". Review your coursework notes for detailed operational rules.`,
      topic,
      difficulty: 'medium',
    });
  }

  // Ensure minimum count
  while (questions.length < count) {
    const idx = questions.length + 1;
    questions.push({
      question: `Question ${idx}: In the context of ${subjectName}, which principle is fundamental to optimal design?`,
      options: [
        'Consistency, modularity, and adherence to standardized protocol specifications',
        'Randomized memory allocation without integrity verification',
        'Exclusively storing unindexed redundant records',
        'Bypassing security access validation layers',
      ],
      correctAnswer: 0,
      explanation: `Systematic design in ${subjectName} relies on modular architecture, strict data integrity, and protocol standards.`,
      topic: targetTopics[0] || subjectName,
      difficulty: 'easy',
    });
  }

  return questions.slice(0, count);
};

/**
 * @desc    Get user's generated quizzes with statistics
 * @route   GET /api/quizzes
 * @access  Private
 */
export const getQuizzes = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subject } = req.query;

    const query = { userId };
    if (subject && subject !== 'all') {
      query.subject = { $regex: new RegExp(`^${subject.trim()}$`, 'i') };
    }

    const quizzes = await quizRepository.find(query).sort({ createdAt: -1 });

    // Aggregate overview stats
    const totalQuizzes = quizzes.length;
    const attemptedQuizzes = quizzes.filter((q) => q.attempts && q.attempts.length > 0);
    const totalAttempts = quizzes.reduce((sum, q) => sum + (q.attempts?.length || 0), 0);
    const avgPercentage =
      attemptedQuizzes.length > 0
        ? Math.round(
          attemptedQuizzes.reduce((sum, q) => sum + (q.bestPercentage || 0), 0) /
          attemptedQuizzes.length
        )
        : 0;

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes,
      stats: {
        totalQuizzes,
        attemptedQuizzes: attemptedQuizzes.length,
        totalAttempts,
        avgPercentage,
      },
    });
  } catch (error) {
    console.error('[QuizController] getQuizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quizzes.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single quiz by ID for player or review
 * @route   GET /api/quizzes/:id
 * @access  Private
 */
export const getQuizById = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const quiz = await quizRepository.findByIdAndUser(id, userId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error('[QuizController] getQuizById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load quiz.',
      error: error.message,
    });
  }
};

/**
 * @desc    Generate a new AI Quiz based on completed topics and uploaded notes
 * @route   POST /api/quizzes/generate
 * @access  Private
 */
export const generateQuiz = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subject, topic, count = 5, difficulty = 'mixed' } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject name is required to generate a quiz.',
      });
    }

    const targetSubject = subject.trim();
    const questionCount = Math.min(Math.max(parseInt(count, 10) || 5, 2), 15);

    // 1. Fetch user progress to find completed topics
    const progress = await progressRepository.findByUserId(userId);
    let completedTopics = [];
    let allSubjectTopics = [];

    if (progress && Array.isArray(progress.subjects)) {
      const matchedSubj = progress.subjects.find(
        (s) => s.name.trim().toLowerCase() === targetSubject.toLowerCase()
      );

      if (matchedSubj && Array.isArray(matchedSubj.topics)) {
        matchedSubj.topics.forEach((t) => {
          allSubjectTopics.push(t.name);
          if (t.completed) {
            completedTopics.push(t.name);
          }
          if (Array.isArray(t.subtopics)) {
            t.subtopics.forEach((st) => {
              if (st.completed) {
                completedTopics.push(`${t.name} - ${st.name}`);
              }
            });
          }
        });
      }
    }

    // Determine target topics
    let selectedTopics = [];
    if (topic && topic.trim() && topic !== 'all' && topic !== 'completed') {
      if (topic.includes(',')) {
        selectedTopics = topic.split(',').map((t) => t.trim()).filter(Boolean);
      } else {
        selectedTopics = [topic.trim()];
      }
    } else if (completedTopics.length > 0) {
      selectedTopics = completedTopics;
    } else if (allSubjectTopics.length > 0) {
      selectedTopics = allSubjectTopics.slice(0, 5);
    } else {
      selectedTopics = [targetSubject];
    }

    // 2. Fetch reference document(s) uploaded by user for this subject
    const userDocs = await documentRepository.findUserDocumentsBySubject(userId, targetSubject);

    let documentContext = '';
    let sourceDocId = null;

    if (userDocs.length > 0) {
      sourceDocId = userDocs[0]._id;
      for (const doc of userDocs) {
        if (doc.filePath) {
          const absPath = getExistingFilePath(doc.filePath);
          if (fs.existsSync(absPath)) {
            try {
              let text = '';
              if (doc.mimeType?.includes('pdf') || absPath.endsWith('.pdf')) {
                text = await extractTextFromPdf(absPath);
              } else {
                text = fs.readFileSync(absPath, 'utf-8');
              }
              if (text && text.trim()) {
                documentContext += `\n--- Document: ${doc.title} ---\n${cleanText(text).substring(0, 5000)}\n`;
              }
            } catch (err) {
              console.warn('[QuizController] Could not read doc file:', err.message);
            }
          }
        }
        if (documentContext.length > 6000) break;
      }
    }

    // 3. Generate questions with Gemini LLM or heuristic fallback
    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    let generatedQuestions = null;

    if (geminiApiKey) {
      const prompt = `You are a university exam professor creating an interactive Multiple Choice assessment quiz for students.
Create exactly ${questionCount} multiple-choice questions (MCQs) for the subject "${targetSubject}".

Topic(s) covered in this assessment:
${selectedTopics.map((t) => `- ${t}`).join('\n')}

Requested Difficulty: ${difficulty}

${documentContext
          ? `Reference Material from student's uploaded notes/syllabus:
"""
${documentContext.substring(0, 4000)}
"""`
          : `Generate rigorous, syllabus-aligned multiple choice questions based on standard curriculum for "${targetSubject}".`
        }

CRITICAL RULES FOR EACH QUESTION:
1. "question": A clear, rigorous question testing conceptual understanding or problem solving.
2. "options": Exactly 4 distinct, plausible answer choices (Strings).
3. "correctAnswer": The 0-based integer index of the correct choice (0, 1, 2, or 3).
4. "explanation": A thorough 2-3 sentence explanation explaining WHY this option is correct and why other key misconceptions are incorrect.
5. "topic": The specific topic from the list above this question belongs to.
6. "difficulty": Choose from "easy", "medium", or "hard".

Respond ONLY with a valid JSON array of objects without markdown formatting or conversational filler:
[
  {
    "question": "What is the primary function of ...?",
    "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
    "correctAnswer": 1,
    "explanation": "Choice B is correct because ...",
    "topic": "Name of Topic",
    "difficulty": "medium"
  }
]`;

      const aiResponse = await callGemini(prompt, geminiApiKey);
      if (aiResponse) {
        generatedQuestions = parseAiQuizJson(aiResponse);
      }
    }

    // Heuristic fallback if AI was unavailable
    if (!generatedQuestions || generatedQuestions.length === 0) {
      generatedQuestions = generateHeuristicQuiz(
        targetSubject,
        selectedTopics,
        documentContext,
        questionCount
      );
    }

    // 4. Create and save Quiz in MongoDB
    let cleanTopicName = targetSubject;
    if (selectedTopics.length > 0) {
      const first = selectedTopics[0].split(',')[0].split(' - ')[0].trim();
      cleanTopicName = first || targetSubject;
    }

    const quizTitle = `${targetSubject}: ${cleanTopicName} Quiz`;
    const topicLabel = cleanTopicName;

    const quiz = await quizRepository.create({
      userId,
      subject: targetSubject,
      topic: topicLabel,
      title: quizTitle,
      difficulty,
      questions: generatedQuestions,
      totalQuestions: generatedQuestions.length,
      sourceDocumentId: sourceDocId,
    });

    res.status(201).json({
      success: true,
      message: `Generated quiz with ${quiz.totalQuestions} questions for ${targetSubject}.`,
      data: quiz,
    });
  } catch (error) {
    console.error('[QuizController] generateQuiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quiz.',
      error: error.message,
    });
  }
};

/**
 * @desc    Submit user answers for a quiz attempt, calculate score and save attempt
 * @route   POST /api/quizzes/:id/submit
 * @access  Private
 */
export const submitQuizResult = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { answers = [], timeSpentSeconds = 0 } = req.body;

    const quiz = await quizRepository.findByIdAndUser(id, userId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    // Calculate score
    let score = 0;
    const selectedAnswers = [];

    quiz.questions.forEach((q, idx) => {
      const userAns = answers.find((a) => a.questionIndex === idx);
      const chosen = userAns ? userAns.selectedOption : -1;
      const isCorrect = chosen === q.correctAnswer;
      if (isCorrect) score += 1;

      selectedAnswers.push({
        questionIndex: idx,
        selectedOption: chosen,
        isCorrect,
      });
    });

    const percentage = Math.round((score / quiz.totalQuestions) * 100);

    const attempt = {
      score,
      totalQuestions: quiz.totalQuestions,
      percentage,
      selectedAnswers,
      timeSpentSeconds: parseInt(timeSpentSeconds, 10) || 0,
      completedAt: new Date(),
    };

    quiz.attempts.push(attempt);
    quiz.lastAttemptAt = new Date();

    if (quiz.bestScore === null || score > quiz.bestScore) {
      quiz.bestScore = score;
      quiz.bestPercentage = percentage;
    }

    await quiz.save();

    // Log recent activity in Progress model
    try {
      await progressRepository.addRecentActivity(userId, {
        id: `act-quiz-${Date.now()}`,
        type: 'study_session',
        title: `Completed ${quiz.title} (Scored ${percentage}%)`,
        subject: quiz.subject,
        timestamp: new Date(),
      }, 15);
    } catch (actErr) {
      console.warn('[QuizController] Could not update recent activity:', actErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Quiz completed! Score: ${score}/${quiz.totalQuestions} (${percentage}%)`,
      data: {
        score,
        totalQuestions: quiz.totalQuestions,
        percentage,
        bestPercentage: quiz.bestPercentage,
        selectedAnswers,
        quiz,
      },
    });
  } catch (error) {
    console.error('[QuizController] submitQuizResult error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record quiz results.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a quiz
 * @route   DELETE /api/quizzes/:id
 * @access  Private
 */
export const deleteQuiz = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const quiz = await quizRepository.deleteByIdAndUser(id, userId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully.',
      deletedId: id,
    });
  } catch (error) {
    console.error('[QuizController] deleteQuiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz.',
      error: error.message,
    });
  }
};
