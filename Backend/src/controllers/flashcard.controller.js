import fs from 'fs';
import path from 'path';
import Flashcard from '../models/flashcard.model.js';
import Document from '../models/document.model.js';
import Progress from '../models/progress.model.js';
import { extractTextFromPdf } from '../services/documentProcessor.js';
import { cleanText } from '../services/textCleaner.js';
import { getExistingFilePath } from './knowledge.controller.js';

/**
 * Helper: Call Google Gemini API with fallback models
 */
const callGemini = async (prompt, apiKey) => {
  if (!apiKey) return null;
  const models = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-pro',
    'gemini-pro-latest',
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
        console.warn(`[Gemini Flashcard] ${model} returned HTTP ${res.status}:`, err.error?.message || 'Error');
      }
    } catch (e) {
      console.warn(`[Gemini Flashcard] ${model} network error:`, e.message);
    }
  }
  return null;
};

/**
 * Helper: Clean and safely parse JSON array returned by AI
 */
const parseAiJsonArray = (rawAiText) => {
  if (!rawAiText) return null;
  try {
    // Remove markdown code fences if present
    let cleaned = rawAiText.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/g, '').trim();

    // Find JSON array start and end
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && item.front && item.back);
    }
    return null;
  } catch (err) {
    console.warn('[FlashcardController] Failed to parse AI JSON:', err.message);
    return null;
  }
};

/**
 * Heuristic Extractor Fallback: Generates definition flashcards directly from document text
 * when Gemini API key is missing or offline
 */
const generateHeuristicFlashcards = (subjectName, topicNames, rawText, count = 5) => {
  const cards = [];
  const text = cleanText(rawText || '');
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 40 && p.length < 800);

  const targetTopics = topicNames && topicNames.length > 0 ? topicNames : [subjectName];

  for (const topic of targetTopics) {
    if (cards.length >= count) break;
    const topicWords = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    // Look for paragraphs mentioning the topic or definition patterns
    for (const para of paragraphs) {
      if (cards.length >= count) break;
      const lower = para.toLowerCase();
      const hasTopic = topicWords.some((w) => lower.includes(w));

      if (hasTopic) {
        // Look for sentences with "is", "defined as", "refers to", "used for", "means"
        const sentences = para.split(/(?<=[.?!])\s+/).filter(Boolean);
        const defSentence = sentences.find((s) =>
          /\b(is defined as|refers to|is a|are defined as|consists of|used to|means that|represents)\b/i.test(s)
        ) || sentences[0];

        if (defSentence && defSentence.length > 25) {
          const front = `What is ${topic} in ${subjectName}?`;
          const back = defSentence.trim();
          const hint = `Think about core principles of ${topic}`;

          if (!cards.some((c) => c.front === front || c.back === back)) {
            cards.push({
              topic,
              front,
              back,
              hint,
              difficulty: 'medium',
            });
          }
        }
      }
    }
  }

  // If still fewer than requested count, generate generic concept prompts from topic names
  if (cards.length < count) {
    for (const topic of targetTopics) {
      if (cards.length >= count) break;
      cards.push({
        topic,
        front: `Explain the fundamental concept and key purpose of ${topic}`,
        back: `${topic} is a core topic in ${subjectName}. Review your notes and textbook to master its key formulas, characteristics, and practical implementation.`,
        hint: `Key topic in ${subjectName}`,
        difficulty: 'easy',
      });
    }
  }

  return cards.slice(0, count);
};

/**
 * @desc    Get user's flashcards with filters (subject, topic, mastery) & statistics
 * @route   GET /api/flashcards
 * @access  Private
 */
export const getFlashcards = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subject, topic, filter, search } = req.query;

    const query = { userId };

    if (subject && subject.trim() && subject !== 'all') {
      query.subject = { $regex: new RegExp(`^${subject.trim()}$`, 'i') };
    }

    if (topic && topic.trim() && topic !== 'all') {
      query.topic = { $regex: new RegExp(`^${topic.trim()}$`, 'i') };
    }

    if (filter === 'mastered') {
      query.isMastered = true;
    } else if (filter === 'learning') {
      query.isMastered = false;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { front: { $regex: s, $options: 'i' } },
        { back: { $regex: s, $options: 'i' } },
        { topic: { $regex: s, $options: 'i' } },
      ];
    }

    const cards = await Flashcard.find(query).sort({ updatedAt: -1, createdAt: -1 });

    // Aggregate statistics across this user's deck
    const allUserCards = await Flashcard.find({ userId });
    const totalCards = allUserCards.length;
    const masteredCards = allUserCards.filter((c) => c.isMastered).length;
    const learningCards = totalCards - masteredCards;
    const masteryPercentage = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

    // Distinct subjects and topics available for filtering
    const subjects = [...new Set(allUserCards.map((c) => c.subject))].sort();
    const topics = [
      ...new Set(
        allUserCards
          .filter((c) => !subject || subject === 'all' || c.subject.toLowerCase() === subject.toLowerCase())
          .map((c) => c.topic)
      ),
    ].sort();

    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards,
      stats: {
        totalCards,
        masteredCards,
        learningCards,
        masteryPercentage,
        currentViewCount: cards.length,
      },
      filters: {
        subjects,
        topics,
      },
    });
  } catch (error) {
    console.error('[FlashcardController] getFlashcards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve flashcards.',
      error: error.message,
    });
  }
};

/**
 * @desc    Generate flashcards using AI based on completed topics and uploaded documents
 * @route   POST /api/flashcards/generate
 * @access  Private
 */
export const generateFlashcards = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subject, topic, count = 5 } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject name is required to generate flashcards.',
      });
    }

    const targetSubject = subject.trim();
    const cardCount = Math.min(Math.max(parseInt(count, 10) || 5, 2), 15);

    // 1. Fetch user's study progress to find which topics have been marked completed
    const progress = await Progress.findOne({ userId });
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

    // Determine target topics to generate from:
    // Case A: User explicitly chose a specific topic
    // Case B: User wants cards generated from completed topics
    // Case C: Fallback to all subject topics if user hasn't checked any boxes yet
    let selectedTopics = [];
    if (topic && topic.trim() && topic !== 'all') {
      selectedTopics = [topic.trim()];
    } else if (completedTopics.length > 0) {
      selectedTopics = completedTopics;
    } else if (allSubjectTopics.length > 0) {
      selectedTopics = allSubjectTopics.slice(0, 4);
    } else {
      selectedTopics = [targetSubject];
    }

    // 2. Fetch relevant document(s) uploaded by user for this subject
    const userDocs = await Document.find({
      uploadedBy: userId,
      subject: { $regex: new RegExp(`^${targetSubject}$`, 'i') },
    }).sort({ createdAt: -1 });

    let documentContext = '';
    let sourceDocId = null;

    if (userDocs.length > 0) {
      sourceDocId = userDocs[0]._id;
      // Read text from primary document file
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
              console.warn('[FlashcardController] Could not read doc file:', err.message);
            }
          }
        }
        if (documentContext.length > 6000) break;
      }
    }

    // 3. Generate flashcards with Gemini or intelligent heuristic fallback
    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    let generatedCards = null;

    if (geminiApiKey) {
      const prompt = `You are an expert university professor and exam preparation assistant.
Create exactly ${cardCount} high-yield study flashcards for the academic subject "${targetSubject}".

Topic(s) studied by the student:
${selectedTopics.map((t) => `- ${t}`).join('\n')}

${
  documentContext
    ? `Reference Material extracted from student's uploaded notes/syllabus:
"""
${documentContext.substring(0, 4000)}
"""`
    : `Generate rigorous, curriculum-aligned flashcards based on standard Computer Science and Engineering principles for "${targetSubject}".`
}

CRITICAL RULES:
1. "topic": Specify which topic from the list above this card covers.
2. "front": Write a focused question, definition prompt, or concept challenge (1-2 sentences).
3. "back": Write a clear, comprehensive, easy-to-remember explanation/answer (2-4 sentences) highlighting key terms.
4. "hint": A short 1-sentence mnemonic or clue if the student struggles to recall.
5. "difficulty": Choose from "easy", "medium", or "hard".

Respond ONLY with a valid JSON array of objects without markdown formatting or surrounding text:
[
  {
    "topic": "Name of Topic",
    "front": "What is ... / Explain ...?",
    "back": "Accurate detailed explanation ...",
    "hint": "Clue or memory hook ...",
    "difficulty": "medium"
  }
]`;

      const aiResponse = await callGemini(prompt, geminiApiKey);
      if (aiResponse) {
        generatedCards = parseAiJsonArray(aiResponse);
      }
    }

    // If AI failed or API key was absent, use heuristic fallback so cards are always generated!
    if (!generatedCards || generatedCards.length === 0) {
      generatedCards = generateHeuristicFlashcards(
        targetSubject,
        selectedTopics,
        documentContext,
        cardCount
      );
    }

    // 4. Save newly generated flashcards into MongoDB
    const createdFlashcards = [];
    for (const card of generatedCards) {
      const doc = await Flashcard.create({
        userId,
        subject: targetSubject,
        topic: card.topic || selectedTopics[0] || targetSubject,
        subtopic: card.subtopic || '',
        front: card.front,
        back: card.back,
        hint: card.hint || '',
        difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium',
        isMastered: false,
        source: 'ai-generated',
        sourceDocumentId: sourceDocId,
      });
      createdFlashcards.push(doc);
    }

    res.status(201).json({
      success: true,
      message: `Generated ${createdFlashcards.length} flashcards for ${targetSubject}.`,
      count: createdFlashcards.length,
      topicsCovered: selectedTopics,
      data: createdFlashcards,
    });
  } catch (error) {
    console.error('[FlashcardController] generateFlashcards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate flashcards.',
      error: error.message,
    });
  }
};

/**
 * @desc    Manually create a custom flashcard
 * @route   POST /api/flashcards
 * @access  Private
 */
export const createManualFlashcard = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subject, topic, front, back, hint, difficulty } = req.body;

    if (!subject || !front || !back) {
      return res.status(400).json({
        success: false,
        message: 'Subject, Front (Question), and Back (Answer) are required.',
      });
    }

    const card = await Flashcard.create({
      userId,
      subject: subject.trim(),
      topic: (topic && topic.trim()) || 'General',
      front: front.trim(),
      back: back.trim(),
      hint: (hint && hint.trim()) || '',
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
      source: 'custom',
    });

    res.status(201).json({
      success: true,
      message: 'Flashcard created successfully.',
      data: card,
    });
  } catch (error) {
    console.error('[FlashcardController] createManualFlashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create flashcard.',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle mastery status of a flashcard
 * @route   PATCH /api/flashcards/:id/master
 * @access  Private
 */
export const toggleFlashcardMastered = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { isMastered } = req.body;

    const card = await Flashcard.findOne({ _id: id, userId });
    if (!card) {
      return res.status(404).json({ success: false, message: 'Flashcard not found.' });
    }

    card.isMastered = typeof isMastered === 'boolean' ? isMastered : !card.isMastered;
    card.reviewCount = (card.reviewCount || 0) + 1;
    card.lastReviewedAt = new Date();
    await card.save();

    res.status(200).json({
      success: true,
      message: card.isMastered ? 'Marked as mastered!' : 'Marked for more practice.',
      data: card,
    });
  } catch (error) {
    console.error('[FlashcardController] toggleFlashcardMastered error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update flashcard mastery.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a flashcard
 * @route   DELETE /api/flashcards/:id
 * @access  Private
 */
export const deleteFlashcard = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const card = await Flashcard.findOneAndDelete({ _id: id, userId });
    if (!card) {
      return res.status(404).json({ success: false, message: 'Flashcard not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Flashcard deleted successfully.',
      deletedId: id,
    });
  } catch (error) {
    console.error('[FlashcardController] deleteFlashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete flashcard.',
      error: error.message,
    });
  }
};

/**
 * @desc    Reset mastery status for all cards in a subject to practice again
 * @route   POST /api/flashcards/reset-mastery
 * @access  Private
 */
export const resetDeckMastery = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subject } = req.body;

    const query = { userId };
    if (subject && subject !== 'all') {
      query.subject = { $regex: new RegExp(`^${subject.trim()}$`, 'i') };
    }

    const result = await Flashcard.updateMany(query, {
      $set: { isMastered: false },
    });

    res.status(200).json({
      success: true,
      message: `Reset mastery for ${result.modifiedCount} flashcards.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('[FlashcardController] resetDeckMastery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset deck mastery.',
      error: error.message,
    });
  }
};
