import Progress from '../models/progress.model.js';
import Document from '../models/document.model.js';
import { extractTopicsFromDocument } from '../services/topicExtractor.service.js';

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
    let progress = await Progress.findOne({ userId });

    if (!progress) {
      progress = await Progress.create({
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
    const userDocs = await Document.find({ uploadedBy: userId }).sort({ createdAt: -1 });

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
          if (!/^top-(dbms|os|cn|ds|se)-\d+$/.test(t.id)) {
            existingParentMap.set(t.name.trim().toLowerCase(), t);
          }
        });

        const synchronizedTopics = [];
        const seenParentNames = new Set();

        hierarchicalChapters.forEach((chapter, pIdx) => {
          const lowerName = chapter.name.trim().toLowerCase();
          if (!seenParentNames.has(lowerName)) {
            seenParentNames.add(lowerName);
            const existingParent = existingParentMap.get(lowerName);

            const existingSubMap = new Map();
            if (existingParent && existingParent.subtopics) {
              existingParent.subtopics.forEach((st) => {
                existingSubMap.set(st.name.trim().toLowerCase(), st);
              });
            }

            const synchronizedSubtopics = [];
            (chapter.subtopics || []).forEach((subName, sIdx) => {
              const subLower = subName.trim().toLowerCase();
              if (existingSubMap.has(subLower)) {
                synchronizedSubtopics.push(existingSubMap.get(subLower));
              } else {
                synchronizedSubtopics.push({
                  id: `subtop-${subj.id}-${pIdx + 1}-${sIdx + 1}`,
                  name: subName.trim(),
                  completed: false,
                  completedAt: null,
                });
              }
            });

            // Parent completion: if it has subtopics, completed when all subtopics are completed
            const allCompleted = synchronizedSubtopics.length > 0
              ? synchronizedSubtopics.every((st) => st.completed)
              : (existingParent ? existingParent.completed : false);

            synchronizedTopics.push({
              id: existingParent?.id || `top-${subj.id}-${pIdx + 1}`,
              name: chapter.name.trim(),
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

    // C. Remove any demo or placeholder subjects with NO content (0 uploaded documents AND 0 topics)
    const activeSubjects = progress.subjects.filter((subj) => {
      const matchingDocs = userDocs.filter(
        (d) => d.subject && d.subject.trim().toLowerCase() === subj.name.trim().toLowerCase()
      );
      const hasDocs = matchingDocs.length > 0;
      const hasTopics = Array.isArray(subj.topics) && subj.topics.length > 0;
      const isCustomUserSubject = subj.isUserCreated === true && !/^sub-(dbms|os|cn|ds|se)$/.test(subj.id);
      return hasDocs || hasTopics || isCustomUserSubject;
    });

    if (activeSubjects.length !== progress.subjects.length) {
      progress.subjects = activeSubjects;
      progressModified = true;
    }

    if (progressModified) {
      await progress.save();
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
      recentDocuments: userDocs.slice(0, 6).map((d) => ({
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

    let progress = await Progress.findOne({ userId });
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress not found.' });
    }

    const subject = progress.subjects.find((s) => s.id === subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found.',
      });
    }

    const topic = subject.topics.find((t) => t.id === topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found.',
      });
    }

    let activityTitle = '';
    let newCompletedState = false;

    // Case 1: Toggling a specific subtopic
    if (subtopicId) {
      const subtopic = (topic.subtopics || []).find((st) => st.id === subtopicId);
      if (!subtopic) {
        return res.status(404).json({ success: false, message: 'Subtopic not found.' });
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

    await progress.save();

    // Recalculate stats
    const userDocs = await Document.find({ uploadedBy: userId });
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

    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = await Progress.create({
        userId,
        subjects: [],
        recentActivities: [],
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

    // Log activity
    progress.recentActivities.unshift({
      id: `act-sub-${Date.now()}`,
      type: 'subject_created',
      title: `Created subject: "${name.trim()}"`,
      subject: name.trim(),
      timestamp: new Date(),
    });

    await progress.save();

    const userDocs = await Document.find({ uploadedBy: userId });
    const stats = calculateStats(progress.subjects, userDocs.length);

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject: {
        ...newSubject,
        totalTopics: formattedTopics.length,
        completedTopics: 0,
        progress: 0,
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

    const progress = await Progress.findOne({ userId });
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress record not found' });
    }

    const subjectIndex = progress.subjects.findIndex((s) => s.id === subjectId);
    if (subjectIndex === -1) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const removedSubject = progress.subjects[subjectIndex];
    progress.subjects.splice(subjectIndex, 1);

    await progress.save();

    const userDocs = await Document.find({ uploadedBy: userId });
    const stats = calculateStats(progress.subjects, userDocs.length);

    return res.status(200).json({
      success: true,
      message: `Subject "${removedSubject.name}" deleted successfully`,
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

    const progress = await Progress.findOne({ userId });
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

    const userDocs = await Document.find({ uploadedBy: userId });
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

    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress({ userId });
    }

    const userDocs = await Document.find({ uploadedBy: userId });
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
