import fs from 'fs';
import path from 'path';
import { progressRepository } from '../repositories/progress.repository.js';
import { documentRepository } from '../repositories/document.repository.js';
import Flashcard from '../models/flashcard.model.js';
import Quiz from '../models/quiz.model.js';
import { extractTopicsFromDocument } from '../services/topicExtractor.service.js';
import { clearDocumentCache } from './knowledge.controller.js';
import { deleteVectorsByDocument } from '../services/chromaService.js';

// Empty default subjects array: subjects are generated dynamically from uploaded documents or user creation
export const DEFAULT_CS_SUBJECTS = [];

// Helper to calculate statistics
const calculateStats = (subjects = [], documentsCount = 0) => {
  const totalSubjects = subjects.length;
  let totalTopics = 0;
  let completedTopics = 0;

  subjects.forEach((subj) => {
    (subj.topics || []).forEach((top) => {
      if (top.subtopics && top.subtopics.length > 0) {
        totalTopics += top.subtopics.length;
        completedTopics += top.subtopics.filter((st) => st.completed).length;
      } else {
        totalTopics += 1;
        if (top.completed) completedTopics += 1;
      }
    });
  });

  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return {
    totalSubjects,
    totalTopics,
    completedTopics,
    overallProgress,
    uploadedDocuments: documentsCount,
  };
};

/**
 * @desc    Get full dashboard summary (Overview, Subject Cards, Topic Tracking, Progress, Activity, Documents)
 * @route   GET /api/progress/dashboard
 * @access  Private
 */
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // 1. Fetch user's progress record from MongoDB or initialize with empty subjects
    let progress = await progressRepository.findByUserId(userId);

    if (!progress) {
      progress = await progressRepository.create({
        userId,
        subjects: [],
        recentActivities: [
          {
            id: 'act-init-1',
            type: 'subject_created',
            title: 'Welcome to AIKMS! Study workspace ready.',
            subject: 'System',
            timestamp: new Date(),
          },
        ],
      });
    }

    // 2. Fetch user's real documents from MongoDB
    const userDocs = await documentRepository.findUserDocuments(userId);

    // 3. Dynamically sync hierarchical topics from actual uploaded documents (PDF, TXT, MD, Notes)
    // No random or demo topics allowed!
    let progressModified = false;

    // A. Ensure any custom subject present in userDocs exists in progress.subjects
    const existingSubjectNames = new Set(progress.subjects.map((s) => s.name.trim().toLowerCase()));
    for (const doc of userDocs) {
      if (doc.subject && doc.subject.trim()) {
        const docSubjName = doc.subject.trim();
        if (!existingSubjectNames.has(docSubjName.toLowerCase())) {
          existingSubjectNames.add(docSubjName.toLowerCase());
          const newSubjId = `sub-custom-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
          progress.subjects.push({
            id: newSubjId,
            name: docSubjName,
            code: '',
            description: `Subject generated from uploaded ${doc.title}`,
            category: 'Coursework',
            icon: 'BookOpen',
            color: '#6366f1',
            topics: [],
            createdAt: new Date(),
          });
          progressModified = true;
        }
      }
    }

    // B. For every subject, sync its topics with the matching uploaded documents
    for (const subj of progress.subjects) {
      const matchingDocs = userDocs.filter(
        (d) => d.subject && d.subject.trim().toLowerCase() === subj.name.trim().toLowerCase()
      );

      if (matchingDocs.length === 0) {
        // If subject has NO uploaded documents: remove any old demo topics!
        // Only keep user manually added topics (if any)
        const userManualTopics = (subj.topics || []).filter(
          (t) => !/^top-(dbms|os|cn|ds|se)-\d+$/.test(t.id) && t.isUserCreated
        );
        if ((subj.topics || []).length !== userManualTopics.length) {
          subj.topics = userManualTopics;
          progressModified = true;
        }
      } else {
        // Fast-path: If subject already has extracted topics saved in DB, use them directly!
        // Do NOT block dashboard loading by re-calling Gemini on every page load.
        const hasExtractedTopics = (subj.topics || []).some((t) => t.isExtracted);
        const forceRefresh = req.query?.force === 'true';

        if (!forceRefresh && hasExtractedTopics && (subj.topics || []).length > 0) {
          continue;
        }

        // First-time extraction (or forced refresh): extract hierarchical topics from files
        const hierarchicalChapters = [];
        for (const doc of matchingDocs) {
          const extracted = await extractTopicsFromDocument(doc);
          hierarchicalChapters.push(...extracted);
        }

        // Map existing topics to retain completion state of both parents and subtopics
        const existingParentMap = new Map();
        (subj.topics || []).forEach((t) => {
          if (t && t.name) {
            existingParentMap.set(t.name.trim().toLowerCase(), t);
            const cleanName = t.name.replace(/^\d+[\.\:\-]?\s*/, '').trim().toLowerCase();
            if (cleanName && !existingParentMap.has(cleanName)) {
              existingParentMap.set(cleanName, t);
            }
          }
        });

        const synchronizedTopics = [];
        const seenParentNames = new Set();

        hierarchicalChapters.forEach((chapter, pIdx) => {
          const rawChapName = typeof chapter === 'string' ? chapter.trim() : (chapter.name || '').trim();
          if (!rawChapName) return;

          const lowerName = rawChapName.toLowerCase();
          const cleanLower = rawChapName.replace(/^\d+[\.\:\-]?\s*/, '').trim().toLowerCase();

          if (!seenParentNames.has(lowerName) && !seenParentNames.has(cleanLower)) {
            seenParentNames.add(lowerName);
            seenParentNames.add(cleanLower);
            const existingParent = existingParentMap.get(lowerName) || existingParentMap.get(cleanLower);

            const existingSubMap = new Map();
            if (existingParent && existingParent.subtopics) {
              existingParent.subtopics.forEach((st) => {
                if (st && st.name) {
                  existingSubMap.set(st.name.trim().toLowerCase(), st);
                  const cleanSubName = st.name.replace(/^\d+[\.\:\-]?\d*[\.\:\-]?\s*/, '').trim().toLowerCase();
                  if (cleanSubName && !existingSubMap.has(cleanSubName)) {
                    existingSubMap.set(cleanSubName, st);
                  }
                }
              });
            }

            const synchronizedSubtopics = [];
            (chapter.subtopics || []).forEach((subName, sIdx) => {
              const rawSubName = typeof subName === 'string' ? subName.trim() : (subName.name || '').trim();
              if (!rawSubName) return;

              const subLower = rawSubName.toLowerCase();
              const cleanSubLower = subLower.replace(/^\d+[\.\:\-]?\d*[\.\:\-]?\s*/, '').trim().toLowerCase();
              const existingSub = existingSubMap.get(subLower) || existingSubMap.get(cleanSubLower);

              if (existingSub) {
                synchronizedSubtopics.push({
                  id: existingSub.id || `subtop-${subj.id}-${pIdx + 1}-${sIdx + 1}`,
                  name: rawSubName,
                  completed: Boolean(existingSub.completed),
                  completedAt: existingSub.completedAt || null,
                });
              } else {
                synchronizedSubtopics.push({
                  id: `subtop-${subj.id}-${pIdx + 1}-${sIdx + 1}`,
                  name: rawSubName,
                  completed: false,
                  completedAt: null,
                });
              }
            });

            // Parent completion: if it has subtopics, completed when all subtopics are completed
            const allCompleted = synchronizedSubtopics.length > 0
              ? synchronizedSubtopics.every((st) => st.completed)
              : (existingParent ? Boolean(existingParent.completed) : false);

            synchronizedTopics.push({
              id: existingParent?.id || `top-${subj.id}-${pIdx + 1}`,
              name: rawChapName,
              completed: allCompleted,
              completedAt: allCompleted ? (existingParent?.completedAt || new Date()) : null,
              isExtracted: true,
              subtopics: synchronizedSubtopics,
            });
          }
        });

        // Retain any user manually added topics
        (subj.topics || []).forEach((t) => {
          if (t.isUserCreated && !seenParentNames.has(t.name.trim().toLowerCase())) {
            seenParentNames.add(t.name.trim().toLowerCase());
            synchronizedTopics.push(t);
          }
        });

        // Determine if signature changed
        const currentSig = (subj.topics || []).map((t) => `${t.id}:${t.completed}:${(t.subtopics || []).length}`).join('|');
        const newSig = synchronizedTopics.map((t) => `${t.id}:${t.completed}:${(t.subtopics || []).length}`).join('|');

        if (currentSig !== newSig) {
          subj.topics = synchronizedTopics;
          progressModified = true;
        }
      }
    }

    // C. Remove legacy placeholder demo subjects (sub-dbms, sub-os, etc.) if they have NO docs and NO topics
    const activeSubjects = progress.subjects.filter((subj) => {
      const isLegacyDemoSubject = /^sub-(dbms|os|cn|ds|se)$/i.test(subj.id);
      if (!isLegacyDemoSubject) {
        // Any real user-created subject or document-derived vault is ALWAYS preserved!
        return true;
      }
      const matchingDocs = userDocs.filter(
        (d) => d.subject && d.subject.trim().toLowerCase() === subj.name.trim().toLowerCase()
      );
      const hasDocs = matchingDocs.length > 0;
      const hasTopics = Array.isArray(subj.topics) && subj.topics.length > 0;
      return hasDocs || hasTopics;
    });

    if (activeSubjects.length !== progress.subjects.length) {
      progress.subjects = activeSubjects;
      progress.markModified('subjects');
      progressModified = true;
    }

    if (progressModified) {
      try {
        await progress.save();
      } catch (saveErr) {
        console.warn('[ProgressController] Auto-sync progress save warning:', saveErr.message);
      }
    }

    // 4. Compute stats
    const stats = calculateStats(progress.subjects, userDocs.length);

    // 5. Construct synthesized activity feed:
    const combinedActivities = [...(progress.recentActivities || [])];

    userDocs.slice(0, 10).forEach((doc) => {
      combinedActivities.push({
        id: `act-doc-${doc._id}`,
        type: doc.contentType === 'note' ? 'note_added' : 'doc_uploaded',
        title: doc.contentType === 'note' ? `Added personal note: "${doc.title}"` : `Uploaded document: "${doc.title}"`,
        subject: doc.subject || 'General',
        timestamp: doc.createdAt,
      });
    });

    // Sort all activities by timestamp descending and take top 15
    combinedActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = combinedActivities.slice(0, 15);

    // 6. Subject cards with progress calculations
    const subjectCards = progress.subjects.map((subj) => {
      const topics = subj.topics || [];
      let total = 0;
      let completed = 0;

      topics.forEach((top) => {
        if (top.subtopics && top.subtopics.length > 0) {
          total += top.subtopics.length;
          completed += top.subtopics.filter((st) => st.completed).length;
        } else {
          total += 1;
          if (top.completed) completed += 1;
        }
      });

      const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Find if user has uploaded any documents matching this subject
      const matchingDocs = userDocs.filter(
        (d) => d.subject && d.subject.trim().toLowerCase() === subj.name.trim().toLowerCase()
      );

      return {
        id: subj.id,
        name: subj.name,
        code: subj.code || '',
        description: subj.description || '',
        category: subj.category || 'Computer Science',
        icon: subj.icon || 'BookOpen',
        color: subj.color || '#10a37f',
        totalTopics: total,
        completedTopics: completed,
        progress: progressPercent,
        topics: subj.topics,
        documentCount: matchingDocs.length,
        createdAt: subj.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      stats,
      subjects: subjectCards,
      recentActivity,
      recentDocuments: userDocs.map((d) => ({
        id: d._id,
        title: d.title,
        subject: d.subject,
        topic: d.topic,
        contentType: d.contentType,
        fileSize: d.fileSize,
        processingStatus: d.processingStatus,
        createdAt: d.createdAt,
      })),
    });
  } catch (error) {
    console.error('[ProgressController] getDashboardData error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle topic or subtopic completion status (updates progress automatically & logs activity)
 * @route   PUT /api/progress/toggle-topic
 * @access  Private
 */
export const toggleTopic = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subjectId, topicId, subtopicId, completed } = req.body;

    if (!subjectId || !topicId) {
      return res.status(400).json({
        success: false,
        message: 'subjectId and topicId are required.',
      });
    }

    let progress = await progressRepository.findByUserId(userId);
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress not found.' });
    }

    // Flexible subject lookup (matches by id, _id, or name)
    const subject = progress.subjects.find(
      (s) =>
        s.id === subjectId ||
        (s._id && s._id.toString() === String(subjectId)) ||
        (s.name && subjectId && s.name.trim().toLowerCase() === String(subjectId).trim().toLowerCase())
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: `Subject not found for id/name: "${subjectId}"`,
      });
    }

    // Flexible topic lookup (matches by id, _id, exact name, or name without leading index numbers like "3. ")
    const cleanTopicId = typeof topicId === 'string' ? topicId.trim() : String(topicId || '');
    const cleanTopicIdNoNum = cleanTopicId.replace(/^\d+[\.\:\-]?\s*/, '').trim().toLowerCase();

    let topic = (subject.topics || []).find(
      (t) =>
        t.id === cleanTopicId ||
        (t._id && t._id.toString() === cleanTopicId) ||
        (t.name && t.name.trim().toLowerCase() === cleanTopicId.toLowerCase()) ||
        (t.name && cleanTopicIdNoNum && t.name.replace(/^\d+[\.\:\-]?\s*/, '').trim().toLowerCase() === cleanTopicIdNoNum)
    );

    // Fallback topic index matching if topicId is numeric e.g. "3" or 3
    if (!topic && /^\d+$/.test(cleanTopicId)) {
      const idx = parseInt(cleanTopicId, 10);
      if (idx > 0 && idx <= (subject.topics || []).length) {
        topic = subject.topics[idx - 1];
      }
    }

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: `Topic not found for id/name: "${topicId}"`,
      });
    }

    let activityTitle = '';
    let newCompletedState = false;

    // Case 1: Toggling a specific subtopic
    if (subtopicId) {
      const cleanSubId = typeof subtopicId === 'string' ? subtopicId.trim() : String(subtopicId || '');
      const cleanSubIdNoNum = cleanSubId.replace(/^\d+[\.\:\-]?\d*[\.\:\-]?\s*/, '').trim().toLowerCase();

      let subtopic = (topic.subtopics || []).find(
        (st) =>
          st.id === cleanSubId ||
          (st._id && st._id.toString() === cleanSubId) ||
          (st.name && st.name.trim().toLowerCase() === cleanSubId.toLowerCase()) ||
          (st.name && cleanSubIdNoNum && st.name.replace(/^\d+[\.\:\-]?\d*[\.\:\-]?\s*/, '').trim().toLowerCase() === cleanSubIdNoNum)
      );

      // Fallback subtopic index e.g. "3.3" -> 3rd subtopic
      if (!subtopic && /^\d+\.\d+$/.test(cleanSubId)) {
        const parts = cleanSubId.split('.');
        const subIndex = parseInt(parts[1], 10) - 1;
        if (topic.subtopics && topic.subtopics[subIndex]) {
          subtopic = topic.subtopics[subIndex];
        }
      }

      if (!subtopic) {
        return res.status(404).json({ success: false, message: `Subtopic not found for id/name: "${subtopicId}"` });
      }

      newCompletedState = typeof completed === 'boolean' ? completed : !subtopic.completed;
      subtopic.completed = newCompletedState;
      subtopic.completedAt = newCompletedState ? new Date() : null;

      // Update parent topic completion state (true if all subtopics completed)
      const allDone = topic.subtopics.length > 0 && topic.subtopics.every((st) => st.completed);
      topic.completed = allDone;
      topic.completedAt = allDone ? new Date() : null;

      activityTitle = newCompletedState
        ? `Studied "${subtopic.name}" under ${topic.name}`
        : `Marked incomplete: "${subtopic.name}"`;
    } else {
      // Case 2: Toggling the parent topic
      newCompletedState = typeof completed === 'boolean' ? completed : !topic.completed;
      topic.completed = newCompletedState;
      topic.completedAt = newCompletedState ? new Date() : null;

      // If parent has subtopics, toggle all subtopics to match
      if (topic.subtopics && topic.subtopics.length > 0) {
        topic.subtopics.forEach((st) => {
          st.completed = newCompletedState;
          st.completedAt = newCompletedState ? new Date() : null;
        });
      }

      activityTitle = newCompletedState
        ? `Completed chapter/topic: "${topic.name}"`
        : `Marked incomplete: "${topic.name}"`;
    }

    // Log recent activity
    const activityItem = {
      id: `act-top-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: newCompletedState ? 'topic_completed' : 'topic_uncompleted',
      title: activityTitle,
      subject: subject.name,
      timestamp: new Date(),
    };

    progress.recentActivities.unshift(activityItem);
    if (progress.recentActivities.length > 50) {
      progress.recentActivities = progress.recentActivities.slice(0, 50);
    }

    // Ensure all subjects, topics, and subtopics have valid string IDs before saving
    (progress.subjects || []).forEach((s) => {
      if (!s.id) s.id = s._id ? s._id.toString() : `sub-${Date.now()}`;
      (s.topics || []).forEach((t) => {
        if (!t.id) t.id = t._id ? t._id.toString() : `top-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        (t.subtopics || []).forEach((st) => {
          if (!st.id) st.id = st._id ? st._id.toString() : `subtop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        });
      });
    });

    progress.markModified('subjects');
    progress.markModified('recentActivities');
    await progress.save();

    // Recalculate stats
    const userDocs = await documentRepository.find({ uploadedBy: userId });
    const stats = calculateStats(progress.subjects, userDocs.length);

    let total = 0;
    let completedCount = 0;
    subject.topics.forEach((top) => {
      if (top.subtopics && top.subtopics.length > 0) {
        total += top.subtopics.length;
        completedCount += top.subtopics.filter((st) => st.completed).length;
      } else {
        total += 1;
        if (top.completed) completedCount += 1;
      }
    });
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      message: `Status updated`,
      subject: {
        id: subject.id,
        _id: subject._id,
        name: subject.name,
        totalTopics: total,
        completedTopics: completedCount,
        progress: progressPercent,
        topics: subject.topics,
      },
      stats,
      latestActivity: activityItem,
    });
  } catch (error) {
    console.error('[ProgressController] toggleTopic error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update topic status',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new subject with custom topics
 * @route   POST /api/progress/subject
 * @access  Private
 */
export const createSubject = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, code, description, category, topics, color, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject name is required.',
      });
    }

    let progress = await progressRepository.findByUserId(userId);
    if (!progress) {
      progress = await progressRepository.create({
        userId,
        subjects: [],
        recentActivities: [],
      });
    }

    // Check if subject with same name already exists
    const duplicate = (progress.subjects || []).find(
      (s) => s.name?.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `A subject named "${name.trim()}" already exists in your curriculum.`,
      });
    }

    const cleanSubjectId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    // Prepare initial topics
    let formattedTopics = [];
    if (Array.isArray(topics) && topics.length > 0) {
      formattedTopics = topics
        .filter((t) => (typeof t === 'string' ? t.trim() : t && t.name))
        .map((t, index) => {
          const tName = typeof t === 'string' ? t.trim() : t.name.trim();
          return {
            id: `top-${cleanSubjectId}-${index + 1}`,
            name: tName,
            completed: false,
            completedAt: null,
          };
        });
    } else {
      // Start with empty topics; topics will be automatically extracted when a document is uploaded for this subject
      formattedTopics = [];
    }

    const newSubject = {
      id: cleanSubjectId,
      name: name.trim(),
      code: code ? code.trim() : '',
      description: description ? description.trim() : '',
      category: category ? category.trim() : 'Computer Science',
      icon: icon || 'BookOpen',
      color: color || '#10a37f',
      topics: formattedTopics,
      isUserCreated: true,
      createdAt: new Date(),
    };

    progress.subjects.push(newSubject);
    progress.markModified('subjects');

    // Log activity
    progress.recentActivities.unshift({
      id: `act-sub-${Date.now()}`,
      type: 'subject_created',
      title: `Created subject: "${name.trim()}"`,
      subject: name.trim(),
      timestamp: new Date(),
    });
    progress.markModified('recentActivities');

    await progress.save();

    const userDocs = await documentRepository.findUserDocuments(userId);
    const stats = calculateStats(progress.subjects, userDocs.length);

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject: {
        ...newSubject,
        totalTopics: formattedTopics.length,
        completedTopics: 0,
        progress: 0,
        documentCount: 0,
      },
      stats,
    });
  } catch (error) {
    console.error('[ProgressController] createSubject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create subject',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a subject
 * @route   DELETE /api/progress/subject/:subjectId
 * @access  Private
 */
export const deleteSubject = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subjectId } = req.params;

    const progress = await progressRepository.findByUserId(userId);
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress record not found' });
    }

    const subjectIndex = progress.subjects.findIndex(
      (s) => s.id === subjectId || (s._id && s._id.toString() === String(subjectId))
    );
    if (subjectIndex === -1) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const removedSubject = progress.subjects[subjectIndex];
    const subjectName = removedSubject.name ? removedSubject.name.trim() : '';
    const subjectNameRegex = new RegExp(`^${subjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    // 1. Remove subject from progress.subjects array
    progress.subjects.splice(subjectIndex, 1);
    progress.markModified('subjects');

    // 2. Find all uploaded documents associated with this subject
    const matchingDocs = await documentRepository.find({
      uploadedBy: userId,
      subject: { $regex: subjectNameRegex },
    });

    // 3. Delete physical files from disk, clear ChromaDB vectors, and clear document cache
    for (const doc of matchingDocs) {
      if (doc.filePath) {
        try {
          const fullPath = path.isAbsolute(doc.filePath) && fs.existsSync(doc.filePath)
            ? doc.filePath
            : (fs.existsSync(path.resolve(process.cwd(), doc.filePath))
                ? path.resolve(process.cwd(), doc.filePath)
                : path.resolve(process.cwd(), 'Backend', doc.filePath));
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (fsErr) {
          console.warn('[ProgressController] Could not unlink file from disk:', fsErr.message);
        }
      }

      const docIdStr = doc._id ? doc._id.toString() : doc.id;
      if (docIdStr) {
        try {
          clearDocumentCache(docIdStr);
        } catch {}

        try {
          await deleteVectorsByDocument(docIdStr);
        } catch {}
      }
    }

    // 4. Delete document records from MongoDB
    await documentRepository.deleteMany({
      uploadedBy: userId,
      subject: { $regex: subjectNameRegex },
    });

    // 5. Delete all Flashcards associated with this subject
    await Flashcard.deleteMany({
      userId,
      $or: [
        { subject: { $regex: subjectNameRegex } },
        { subjectId: removedSubject.id },
      ],
    });

    // 6. Delete all Quizzes associated with this subject
    await Quiz.deleteMany({
      userId,
      $or: [
        { subject: { $regex: subjectNameRegex } },
        { subjectId: removedSubject.id },
      ],
    });

    // 7. Log recent activity
    progress.recentActivities.unshift({
      id: `act-del-sub-${Date.now()}`,
      type: 'subject_created',
      title: `Deleted subject "${removedSubject.name}" and all related materials`,
      subject: 'System',
      timestamp: new Date(),
    });
    progress.markModified('recentActivities');

    await progress.save();

    // 8. Re-calculate stats with remaining user documents
    const userDocs = await documentRepository.findUserDocuments(userId);
    const stats = calculateStats(progress.subjects, userDocs.length);

    return res.status(200).json({
      success: true,
      message: `Subject "${removedSubject.name}" and all related study materials deleted successfully`,
      deletedSubjectId: subjectId,
      deletedSubjectName: removedSubject.name,
      deletedDocsCount: matchingDocs.length,
      stats,
    });
  } catch (error) {
    console.error('[ProgressController] deleteSubject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete subject',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a subject's name and details
 * @route   PUT /api/progress/subject/:subjectId
 * @access  Private
 */
export const updateSubject = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subjectId } = req.params;
    const { name, code, description, category, color, icon } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name cannot be empty.' });
    }

    const progress = await progressRepository.findByUserId(userId);
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress record not found' });
    }

    const subject = progress.subjects.find((s) => s.id === subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const oldName = subject.name;
    const newName = name ? name.trim() : oldName;

    if (name) subject.name = newName;
    if (code !== undefined) subject.code = code.trim();
    if (description !== undefined) subject.description = description.trim();
    if (category !== undefined) subject.category = category.trim();
    if (color !== undefined) subject.color = color;
    if (icon !== undefined) subject.icon = icon;

    // If subject name changed, also update matching user documents so they stay linked
    if (name && oldName.trim().toLowerCase() !== newName.trim().toLowerCase()) {
      await documentRepository.updateSubjectName(userId, oldName, newName);
    }

    // Log activity
    progress.recentActivities.unshift({
      id: `act-ren-${Date.now()}`,
      type: 'subject_created',
      title: `Renamed subject from "${oldName}" to "${newName}"`,
      subject: newName,
      timestamp: new Date(),
    });

    await progress.save();

    const userDocs = await documentRepository.find({ uploadedBy: userId });
    const stats = calculateStats(progress.subjects, userDocs.length);

    return res.status(200).json({
      success: true,
      message: `Subject updated successfully`,
      subject,
      stats,
    });
  } catch (error) {
    console.error('[ProgressController] updateSubject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update subject',
      error: error.message,
    });
  }
};

/**
 * @desc    Add a new topic to a subject
 * @route   POST /api/progress/subject/:subjectId/topic
 * @access  Private
 */
export const addTopicToSubject = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subjectId } = req.params;
    const { name, parentTopicId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Topic name is required.' });
    }

    const progress = await progressRepository.findByUserId(userId);
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress record not found' });
    }

    const subject = progress.subjects.find((s) => s.id === subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    let createdItem = null;
    if (parentTopicId) {
      const parentTopic = subject.topics.find((t) => t.id === parentTopicId);
      if (!parentTopic) {
        return res.status(404).json({ success: false, message: 'Parent topic not found' });
      }
      if (!parentTopic.subtopics) parentTopic.subtopics = [];
      createdItem = {
        id: `subtop-${subjectId}-${Date.now()}`,
        name: name.trim(),
        completed: false,
        completedAt: null,
      };
      parentTopic.subtopics.push(createdItem);
      parentTopic.completed = false;
    } else {
      createdItem = {
        id: `top-${subjectId}-${Date.now()}`,
        name: name.trim(),
        completed: false,
        completedAt: null,
        isUserCreated: true,
        isExtracted: false,
        subtopics: [],
      };
      subject.topics.push(createdItem);
    }

    await progress.save();

    const userDocs = await documentRepository.find({ uploadedBy: userId });
    const stats = calculateStats(progress.subjects, userDocs.length);

    let total = 0;
    let completedCount = 0;
    subject.topics.forEach((top) => {
      if (top.subtopics && top.subtopics.length > 0) {
        total += top.subtopics.length;
        completedCount += top.subtopics.filter((st) => st.completed).length;
      } else {
        total += 1;
        if (top.completed) completedCount += 1;
      }
    });
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return res.status(201).json({
      success: true,
      message: parentTopicId ? 'Subtopic added successfully' : 'Topic added successfully',
      topic: createdItem,
      subject: {
        id: subject.id,
        name: subject.name,
        totalTopics: total,
        completedTopics: completedCount,
        progress: progressPercent,
        topics: subject.topics,
      },
      stats,
    });
  } catch (error) {
    console.error('[ProgressController] addTopicToSubject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add topic',
      error: error.message,
    });
  }
};

/**
 * @desc    Reset subjects back to the default core CS curriculum
 * @route   POST /api/progress/reset-defaults
 * @access  Private
 */
export const resetDefaultSubjects = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    let progress = await progressRepository.findByUserId(userId);
    if (!progress) {
      progress = progressRepository.instantiate({ userId });
    }

    const userDocs = await documentRepository.find({ uploadedBy: userId });
    const userDocSubjects = new Set(userDocs.map((d) => (d.subject || '').trim().toLowerCase()));

    // Filter out subjects with no matching documents and no topics
    progress.subjects = progress.subjects.filter((subj) => {
      const hasDocs = userDocSubjects.has(subj.name.trim().toLowerCase());
      const hasTopics = Array.isArray(subj.topics) && subj.topics.length > 0;
      return hasDocs || hasTopics;
    });

    progress.recentActivities.unshift({
      id: `act-reset-${Date.now()}`,
      type: 'subject_created',
      title: 'Cleaned curriculum to active study materials',
      subject: 'System',
      timestamp: new Date(),
    });

    await progress.save();

    const stats = calculateStats(progress.subjects, userDocs.length);

    return res.status(200).json({
      success: true,
      message: 'Curriculum cleaned to active subjects',
      subjects: progress.subjects,
      stats,
    });
  } catch (error) {
    console.error('[ProgressController] resetDefaultSubjects error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset default subjects',
      error: error.message,
    });
  }
};
