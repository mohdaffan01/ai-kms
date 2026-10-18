import Progress from '../models/progress.model.js';
import Document from '../models/document.model.js';

export const DEFAULT_CS_SUBJECTS = [
  {
    id: 'sub-dbms',
    name: 'DBMS',
    code: 'CS-301',
    description: 'Database Management Systems, relational design, SQL & transactions',
    category: 'Computer Science',
    icon: 'Database',
    color: '#10a37f',
    topics: [
      { id: 'top-dbms-1', name: 'Relational Model & Constraints', completed: false },
      { id: 'top-dbms-2', name: 'SQL Queries, Joins & Subqueries', completed: false },
      { id: 'top-dbms-3', name: 'ER Modeling & Relational Schema', completed: false },
      { id: 'top-dbms-4', name: 'Functional Dependencies & Normalization (1NF, 2NF, 3NF, BCNF)', completed: false },
      { id: 'top-dbms-5', name: 'Transaction Management & ACID Properties', completed: false },
      { id: 'top-dbms-6', name: 'Concurrency Control & Two-Phase Locking', completed: false },
      { id: 'top-dbms-7', name: 'Indexing Techniques, B-Trees & Hashing', completed: false },
    ],
  },
  {
    id: 'sub-os',
    name: 'Operating Systems',
    code: 'CS-302',
    description: 'Process management, concurrency, memory allocation & file systems',
    category: 'Computer Science',
    icon: 'Cpu',
    color: '#0ea5e9',
    topics: [
      { id: 'top-os-1', name: 'OS Architecture, System Calls & Dual Mode', completed: false },
      { id: 'top-os-2', name: 'Process State, PCB & Context Switching', completed: false },
      { id: 'top-os-3', name: 'CPU Scheduling Algorithms (FCFS, SJF, Round Robin)', completed: false },
      { id: 'top-os-4', name: 'Inter-Process Communication & Synchronization (Semaphores, Mutex)', completed: false },
      { id: 'top-os-5', name: 'Deadlocks: Prevention, Avoidance & Banker Algorithm', completed: false },
      { id: 'top-os-6', name: 'Memory Management, Paging & Segmentation', completed: false },
      { id: 'top-os-7', name: 'Virtual Memory & Page Replacement (LRU, FIFO)', completed: false },
      { id: 'top-os-8', name: 'File Systems & Disk Scheduling (SCAN, C-LOOK)', completed: false },
    ],
  },
  {
    id: 'sub-cn',
    name: 'Computer Networks',
    code: 'CS-303',
    description: 'OSI/TCP-IP models, routing protocols, subnetting & transport layer',
    category: 'Computer Science',
    icon: 'Network',
    color: '#8b5cf6',
    topics: [
      { id: 'top-cn-1', name: 'OSI 7-Layer & TCP/IP Architecture', completed: false },
      { id: 'top-cn-2', name: 'Data Link Layer Framing, Flow & Error Control (CRC)', completed: false },
      { id: 'top-cn-3', name: 'Medium Access Control (CSMA/CD & Ethernet)', completed: false },
      { id: 'top-cn-4', name: 'IPv4/IPv6 Addressing, Subnetting & CIDR', completed: false },
      { id: 'top-cn-5', name: 'Routing Algorithms (Dijkstra, Distance Vector, BGP)', completed: false },
      { id: 'top-cn-6', name: 'Transport Layer: TCP 3-Way Handshake vs UDP', completed: false },
      { id: 'top-cn-7', name: 'TCP Flow Control & Congestion Control', completed: false },
      { id: 'top-cn-8', name: 'Application Protocols: DNS, HTTP/HTTPS, DHCP', completed: false },
    ],
  },
  {
    id: 'sub-ds',
    name: 'Data Structures',
    code: 'CS-201',
    description: 'Fundamental data structures, trees, graphs, sorting & algorithm complexity',
    category: 'Computer Science',
    icon: 'Layers',
    color: '#f59e0b',
    topics: [
      { id: 'top-ds-1', name: 'Arrays, Matrices & Pointer Arithmetic', completed: false },
      { id: 'top-ds-2', name: 'Singly, Doubly & Circular Linked Lists', completed: false },
      { id: 'top-ds-3', name: 'Stacks (Infix to Postfix) & Queues (Circular/Deque)', completed: false },
      { id: 'top-ds-4', name: 'Binary Trees & Binary Search Trees (BST)', completed: false },
      { id: 'top-ds-5', name: 'Balanced Search Trees (AVL & Red-Black)', completed: false },
      { id: 'top-ds-6', name: 'Heaps, Priority Queues & Heap Sort', completed: false },
      { id: 'top-ds-7', name: 'Graph Traversals: BFS, DFS & Topological Sort', completed: false },
      { id: 'top-ds-8', name: 'Shortest Path (Dijkstra) & Minimum Spanning Trees (Kruskal, Prim)', completed: false },
    ],
  },
  {
    id: 'sub-se',
    name: 'Software Engineering',
    code: 'CS-401',
    description: 'SDLC methodologies, Agile, UML design, testing & deployment pipelines',
    category: 'Computer Science',
    icon: 'Boxes',
    color: '#ec4899',
    topics: [
      { id: 'top-se-1', name: 'Software Development Life Cycle (SDLC) Models', completed: false },
      { id: 'top-se-2', name: 'Agile Frameworks, Scrum & User Stories', completed: false },
      { id: 'top-se-3', name: 'Requirements Engineering, SRS & Feasibility Study', completed: false },
      { id: 'top-se-4', name: 'System Design & Unified Modeling Language (UML)', completed: false },
      { id: 'top-se-5', name: 'Software Architecture & Design Patterns (Singleton, Factory, MVC)', completed: false },
      { id: 'top-se-6', name: 'Software Testing: Unit, Integration, Black & White Box', completed: false },
      { id: 'top-se-7', name: 'Code Quality, Refactoring & CI/CD Pipelines', completed: false },
    ],
  },
];

// Helper to calculate statistics
const calculateStats = (subjects = [], documentsCount = 0) => {
  const totalSubjects = subjects.length;
  let totalTopics = 0;
  let completedTopics = 0;

  subjects.forEach((subj) => {
    const topics = subj.topics || [];
    totalTopics += topics.length;
    completedTopics += topics.filter((t) => t.completed).length;
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

    // 1. Fetch user's progress record from MongoDB or initialize with default CS subjects
    let progress = await Progress.findOne({ userId });

    if (!progress) {
      progress = await Progress.create({
        userId,
        subjects: DEFAULT_CS_SUBJECTS,
        recentActivities: [
          {
            id: 'act-init-1',
            type: 'subject_created',
            title: 'Welcome to AIKMS! Curriculum loaded with 5 core subjects.',
            subject: 'System',
            timestamp: new Date(),
          },
        ],
      });
    }

    // 2. Fetch user's real documents from MongoDB
    const userDocs = await Document.find({ uploadedBy: userId }).sort({ createdAt: -1 });

    // 3. Compute stats
    const stats = calculateStats(progress.subjects, userDocs.length);

    // 4. Construct synthesized activity feed:
    // Combine recentActivities with recent document uploads
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

    // 5. Subject cards with progress calculations
    const subjectCards = progress.subjects.map((subj) => {
      const topics = subj.topics || [];
      const total = topics.length;
      const completed = topics.filter((t) => t.completed).length;
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
 * @desc    Toggle topic completion status (updates progress automatically & logs activity)
 * @route   PUT /api/progress/toggle-topic
 * @access  Private
 */
export const toggleTopic = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subjectId, topicId, completed } = req.body;

    if (!subjectId || !topicId) {
      return res.status(400).json({
        success: false,
        message: 'subjectId and topicId are required.',
      });
    }

    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = await Progress.create({
        userId,
        subjects: DEFAULT_CS_SUBJECTS,
        recentActivities: [],
      });
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

    const newCompletedState = typeof completed === 'boolean' ? completed : !topic.completed;
    topic.completed = newCompletedState;
    topic.completedAt = newCompletedState ? new Date() : null;

    // Log recent activity
    const activityItem = {
      id: `act-top-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: newCompletedState ? 'topic_completed' : 'topic_uncompleted',
      title: newCompletedState
        ? `Completed topic: "${topic.name}"`
        : `Marked incomplete: "${topic.name}"`,
      subject: subject.name,
      timestamp: new Date(),
    };

    progress.recentActivities.unshift(activityItem);
    // Keep max 50 activity items in DB
    if (progress.recentActivities.length > 50) {
      progress.recentActivities = progress.recentActivities.slice(0, 50);
    }

    await progress.save();

    // Recalculate stats
    const userDocs = await Document.find({ uploadedBy: userId });
    const stats = calculateStats(progress.subjects, userDocs.length);

    // Subject statistics
    const total = subject.topics.length;
    const completedCount = subject.topics.filter((t) => t.completed).length;
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      message: `Topic marked as ${newCompletedState ? 'completed' : 'incomplete'}`,
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
        subjects: DEFAULT_CS_SUBJECTS,
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
      // Default placeholder topics if none entered
      formattedTopics = [
        { id: `top-${cleanSubjectId}-1`, name: 'Introduction & Core Concepts', completed: false },
        { id: `top-${cleanSubjectId}-2`, name: 'Fundamental Principles', completed: false },
        { id: `top-${cleanSubjectId}-3`, name: 'Advanced Methodologies & Applications', completed: false },
      ];
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
    const { name } = req.body;

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

    const newTopic = {
      id: `top-${subjectId}-${Date.now()}`,
      name: name.trim(),
      completed: false,
      completedAt: null,
    };

    subject.topics.push(newTopic);
    await progress.save();

    const userDocs = await Document.find({ uploadedBy: userId });
    const stats = calculateStats(progress.subjects, userDocs.length);

    const total = subject.topics.length;
    const completedCount = subject.topics.filter((t) => t.completed).length;
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return res.status(201).json({
      success: true,
      message: 'Topic added successfully',
      topic: newTopic,
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

    progress.subjects = DEFAULT_CS_SUBJECTS;
    progress.recentActivities.unshift({
      id: `act-reset-${Date.now()}`,
      type: 'subject_created',
      title: 'Restored default Computer Science curriculum subjects',
      subject: 'System',
      timestamp: new Date(),
    });

    await progress.save();

    const userDocs = await Document.find({ uploadedBy: userId });
    const stats = calculateStats(progress.subjects, userDocs.length);

    return res.status(200).json({
      success: true,
      message: 'Default CS curriculum subjects restored',
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
