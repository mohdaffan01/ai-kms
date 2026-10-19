import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain,
  HelpCircle,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Play,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  X,
  Lightbulb,
  Check,
  ArrowLeft,
  BarChart3,
  Sparkles
} from 'lucide-react';
import {
  getQuizzesApi,
  getQuizByIdApi,
  generateQuizApi,
  submitQuizResultApi,
  deleteQuizApi,
} from '../../api/quizApi';
import { getDashboardDataApi } from '../../api/progressApi';
import '../../styles/quiz.css';

const QuizView = ({ initialSubject = '' }) => {
  // Main view modes: 'hub' | 'player' | 'results'
  const [viewMode, setViewMode] = useState('hub');

  // Hub data & filters
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    attemptedQuizzes: 0,
    totalAttempts: 0,
    avgPercentage: 0,
  });

  // User's subjects & completed topics from Progress
  const [dashboardSubjects, setDashboardSubjects] = useState([]);

  // Active Quiz (Player & Results)
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({}); // { [qIndex]: optionIndex }
  const [revealedQuestions, setRevealedQuestions] = useState({}); // { [qIndex]: boolean }
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef(null);

  // Generator Modal state
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genSubject, setGenSubject] = useState('');
  const [genTopicMode, setGenTopicMode] = useState('completed'); // 'completed' | 'specific' | 'all'
  const [genSpecificTopic, setGenSpecificTopic] = useState('');
  const [genCount, setGenCount] = useState(5);
  const [genDifficulty, setGenDifficulty] = useState('mixed');
  const [genFeedback, setGenFeedback] = useState({ error: '', success: '' });

  // 1. Fetch user's subjects & topics progress
  const fetchDashboardSubjects = async () => {
    try {
      const res = await getDashboardDataApi();
      if (res && res.subjects) {
        setDashboardSubjects(res.subjects);
        if (!genSubject && res.subjects.length > 0) {
          setGenSubject(res.subjects[0].name);
        }
      }
    } catch (err) {
      console.warn('Could not fetch dashboard subjects:', err.message);
    }
  };

  // 2. Fetch quizzes list
  const fetchQuizzes = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (selectedSubject && selectedSubject !== 'all') {
        params.subject = selectedSubject;
      }
      const res = await getQuizzesApi(params);
      if (res && res.data) {
        setQuizzes(res.data);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Fetch quizzes error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubject]);

  useEffect(() => {
    fetchDashboardSubjects();
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Timer logic for Player Mode
  useEffect(() => {
    if (viewMode === 'player') {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewMode]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper: Extract completed topics for selected generator subject
  const getCompletedTopics = (subjName) => {
    const s = dashboardSubjects.find(
      (item) => item.name?.toLowerCase() === subjName?.toLowerCase()
    );
    if (!s || !Array.isArray(s.topics)) return [];

    const completed = [];
    s.topics.forEach((t) => {
      if (t.completed) completed.push(t.name);
      if (Array.isArray(t.subtopics)) {
        t.subtopics.forEach((st) => {
          if (st.completed) completed.push(`${t.name} - ${st.name}`);
        });
      }
    });
    return completed;
  };

  const completedTopicsForGen = getCompletedTopics(genSubject || selectedSubject);

  // Filtered quizzes for display in hub
  const filteredQuizzes = quizzes.filter((q) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.title?.toLowerCase().includes(query) ||
      q.subject?.toLowerCase().includes(query) ||
      q.topic?.toLowerCase().includes(query)
    );
  });

  // Start / Retake Quiz
  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQIndex(0);
    setSelectedOptions({});
    setRevealedQuestions({});
    setTimerSeconds(0);
    setQuizResult(null);
    setViewMode('player');
  };

  // Select option in player
  const handleSelectOption = (optIndex) => {
    if (revealedQuestions[currentQIndex]) return; // Already revealed

    setSelectedOptions((prev) => ({
      ...prev,
      [currentQIndex]: optIndex,
    }));

    // Instantly reveal feedback & explanation for interactive learning
    setRevealedQuestions((prev) => ({
      ...prev,
      [currentQIndex]: true,
    }));
  };

  // Submit quiz attempt
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    try {
      setIsSubmitting(true);
      const answersPayload = activeQuiz.questions.map((_, idx) => ({
        questionIndex: idx,
        selectedOption: selectedOptions[idx] !== undefined ? selectedOptions[idx] : -1,
      }));

      const res = await submitQuizResultApi(activeQuiz._id, {
        answers: answersPayload,
        timeSpentSeconds: timerSeconds,
      });

      if (res && res.data) {
        setQuizResult(res.data);
        setViewMode('results');
        fetchQuizzes(); // Refresh list & stats
      }
    } catch (err) {
      console.error('Submit quiz error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct deletion without popup per user instruction
  const handleDeleteQuiz = async (quizId, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteQuizApi(quizId);
      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
      fetchQuizzes();
    } catch (err) {
      console.error('Delete quiz error:', err);
    }
  };

  // AI Quiz Generation handler
  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!genSubject) {
      setGenFeedback({ error: 'Please select a subject.', success: '' });
      return;
    }

    try {
      setIsGenerating(true);
      setGenFeedback({ error: '', success: '' });

      let targetTopic = 'all';
      if (genTopicMode === 'specific' && genSpecificTopic.trim()) {
        targetTopic = genSpecificTopic.trim();
      } else if (genTopicMode === 'completed') {
        targetTopic = 'completed';
      }

      const res = await generateQuizApi({
        subject: genSubject,
        topic: targetTopic,
        count: genCount,
        difficulty: genDifficulty,
      });

      if (res && res.data) {
        setGenFeedback({ error: '', success: 'Quiz generated successfully!' });
        setTimeout(() => {
          setIsGenModalOpen(false);
          setGenFeedback({ error: '', success: '' });
          fetchQuizzes();
          handleStartQuiz(res.data);
        }, 700);
      }
    } catch (err) {
      setGenFeedback({
        error: err.response?.data?.message || 'Failed to generate quiz. Try again.',
        success: '',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper: Format specific quiz title & topic dynamically
  const getDisplayTitle = (quiz) => {
    if (!quiz) return 'Assessment Quiz';
    let t = (quiz.title || '').trim();

    // If it has concatenated comma-separated topics, take the main topic segment
    if (t.includes(',')) {
      t = t.split(',')[0].trim();
    }

    // If title is generic (e.g. "DBMS Practice Assessment"), extract real topic from questions or topic field
    const isGeneric =
      t.toLowerCase().endsWith('practice assessment') ||
      t.toLowerCase() === `${quiz.subject?.toLowerCase()} assessment` ||
      t.toLowerCase() === `${quiz.subject?.toLowerCase()} quiz`;

    if (isGeneric) {
      if (quiz.topic && !quiz.topic.toLowerCase().includes('all') && !quiz.topic.toLowerCase().includes('studied')) {
        const cleanTop = quiz.topic.split(',')[0].trim();
        return `${quiz.subject}: ${cleanTop}`;
      }
      if (Array.isArray(quiz.questions) && quiz.questions.length > 0 && quiz.questions[0].topic) {
        return `${quiz.subject}: ${quiz.questions[0].topic}`;
      }
    }

    return t;
  };

  const getDisplayTopic = (quiz) => {
    if (!quiz) return 'General';
    let top = (quiz.topic || '').trim();
    if (top.includes(',')) {
      top = top.split(',')[0].trim();
    }
    if (
      (top.toLowerCase().includes('all') || top.toLowerCase().includes('studied') || !top) &&
      Array.isArray(quiz.questions) &&
      quiz.questions.length > 0 &&
      quiz.questions[0].topic
    ) {
      return quiz.questions[0].topic;
    }
    return top || quiz.subject || 'General';
  };

  /* ==========================================================================
     RENDER: Active Quiz Player View
     ========================================================================== */
  if (viewMode === 'player' && activeQuiz) {
    const question = activeQuiz.questions[currentQIndex];
    const isAnswered = selectedOptions[currentQIndex] !== undefined;
    const isRevealed = revealedQuestions[currentQIndex];
    const userSelected = selectedOptions[currentQIndex];
    const isLastQuestion = currentQIndex === activeQuiz.questions.length - 1;

    return (
      <div className="quiz-container">
        <div className="quiz-player-view">
          {/* Top Navigation */}
          <div className="quiz-player-nav">
            <button
              className="btn-quiz-secondary"
              onClick={() => setViewMode('hub')}
            >
              <ArrowLeft size={16} /> Exit to Hub
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span className="fc-badge subject">{activeQuiz.subject}</span>
              <span className="quiz-player-timer">
                <Clock size={14} /> {formatTimer(timerSeconds)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="quiz-player-progress-bar">
            <div
              className="quiz-player-progress-fill"
              style={{
                width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Box */}
          <div className="quiz-question-box">
            <div className="quiz-question-header">
              <span className="quiz-question-number">
                Question {currentQIndex + 1} of {activeQuiz.questions.length}
              </span>
              <span className={`fc-badge difficulty-${question.difficulty || 'medium'}`}>
                {question.difficulty || 'medium'}
              </span>
            </div>

            <h2 className="quiz-question-text">{question.question}</h2>

            {/* Options */}
            <div className="quiz-options-list">
              {question.options.map((opt, oIndex) => {
                let optClass = 'quiz-option-btn';
                if (isRevealed) {
                  if (oIndex === question.correctAnswer) {
                    optClass += ' correct';
                  } else if (userSelected === oIndex) {
                    optClass += ' wrong';
                  } else {
                    optClass += ' dimmed';
                  }
                } else if (userSelected === oIndex) {
                  optClass += ' selected';
                }

                const letter = String.fromCharCode(65 + oIndex); // A, B, C, D

                return (
                  <button
                    key={oIndex}
                    className={optClass}
                    onClick={() => handleSelectOption(oIndex)}
                    disabled={isRevealed}
                  >
                    <div className="quiz-option-left">
                      <div className="quiz-option-index">{letter}</div>
                      <span>{opt}</span>
                    </div>

                    {isRevealed && oIndex === question.correctAnswer && (
                      <CheckCircle2 size={20} color="#10a37f" />
                    )}
                    {isRevealed && userSelected === oIndex && oIndex !== question.correctAnswer && (
                      <XCircle size={20} color="#ef4444" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Drawer (Shows once answered) */}
            {isRevealed && (
              <div className="quiz-explanation-box">
                <div className="quiz-explanation-title">
                  <Lightbulb size={16} /> Conceptual Explanation:
                </div>
                <p className="quiz-explanation-text">{question.explanation}</p>
              </div>
            )}

            {/* Player Controls */}
            <div className="quiz-player-footer">
              <button
                className="btn-quiz-secondary"
                onClick={() => setCurrentQIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentQIndex === 0}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              {!isLastQuestion ? (
                <button
                  className="btn-quiz-primary"
                  onClick={() => setCurrentQIndex((prev) => prev + 1)}
                  disabled={!isRevealed}
                >
                  Next Question <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  className="btn-quiz-primary"
                  onClick={handleSubmitQuiz}
                  disabled={!isRevealed || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Award size={16} /> Finish & View Results
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     RENDER: Quiz Results View
     ========================================================================== */
  if (viewMode === 'results' && quizResult) {
    const { score, totalQuestions, percentage } = quizResult;
    let badgeClass = 'high';
    let feedbackHeading = 'Outstanding Mastery!';
    let feedbackSub = 'You showed comprehensive understanding of this coursework material.';

    if (percentage < 50) {
      badgeClass = 'low';
      feedbackHeading = 'Needs Practice';
      feedbackSub = 'Review the syllabus notes and attempt this quiz again to build retention.';
    } else if (percentage < 75) {
      badgeClass = 'medium';
      feedbackHeading = 'Good Progress!';
      feedbackSub = 'Solid grasp of core fundamentals, with room to refine key distinctions.';
    }

    return (
      <div className="quiz-container">
        <div className="quiz-results-card">
          <div className={`quiz-results-badge-wrap ${badgeClass}`}>
            <Award size={40} />
          </div>

          <div className="quiz-results-score-display">
            <h1 className="quiz-results-percentage">{percentage}%</h1>
            <p className="quiz-results-fraction">
              {score} of {totalQuestions} Questions Correct
            </p>
          </div>

          <div>
            <h3 style={{ color: '#ffffff', margin: '0 0 0.4rem 0', fontSize: '1.25rem' }}>
              {feedbackHeading}
            </h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem', maxWidth: '440px' }}>
              {feedbackSub}
            </p>
          </div>

          {/* Metrics */}
          <div className="quiz-results-metrics-grid">
            <div className="quiz-res-metric">
              <span>Time Spent</span>
              <span>{formatTimer(timerSeconds)}</span>
            </div>
            <div className="quiz-res-metric">
              <span>Accuracy</span>
              <span>{percentage}%</span>
            </div>
            <div className="quiz-res-metric">
              <span>Best Score</span>
              <span>{quizResult.bestPercentage || percentage}%</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="quiz-results-actions">
            <button
              className="btn-quiz-secondary"
              onClick={() => handleStartQuiz(activeQuiz)}
            >
              <RotateCcw size={16} /> Retake Quiz
            </button>
            <button
              className="btn-quiz-primary"
              onClick={() => setViewMode('hub')}
            >
              <Brain size={16} /> Back to Quiz Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     RENDER: Main Quiz Hub View
     ========================================================================== */
  return (
    <div className="quiz-container">
      {/* Top Header */}
      <div className="quiz-header">
        <div className="quiz-header-left">
          <div className="quiz-header-icon">
            <Brain size={24} />
          </div>
          <div>
            <h1 className="quiz-title">AI Quiz Hub & Assessment</h1>
            <p className="quiz-subtitle">
              Syllabus-grounded multiple-choice quizzes generated from your completed topics & documents
            </p>
          </div>
        </div>

        <div className="quiz-header-actions">
          <button
            className="btn-quiz-primary"
            onClick={() => setIsGenModalOpen(true)}
          >
            <Brain size={16} /> Generate AI Quiz
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="quiz-stats-grid">
        <div className="quiz-stat-card">
          <div className="quiz-stat-icon-wrap quizzes">
            <HelpCircle size={22} />
          </div>
          <div className="quiz-stat-meta">
            <span className="quiz-stat-label">Total Quizzes</span>
            <span className="quiz-stat-val">{stats.totalQuizzes}</span>
          </div>
        </div>

        <div className="quiz-stat-card">
          <div className="quiz-stat-icon-wrap attempts">
            <BarChart3 size={22} />
          </div>
          <div className="quiz-stat-meta">
            <span className="quiz-stat-label">Quizzes Attempted</span>
            <span className="quiz-stat-val">{stats.attemptedQuizzes}</span>
          </div>
        </div>

        <div className="quiz-stat-card">
          <div className="quiz-stat-icon-wrap score">
            <Award size={22} />
          </div>
          <div className="quiz-stat-meta">
            <span className="quiz-stat-label">Avg. Best Score</span>
            <span className="quiz-stat-val">{stats.avgPercentage}%</span>
          </div>
        </div>

        <div className="quiz-stat-card">
          <div className="quiz-stat-icon-wrap rank">
            <Clock size={22} />
          </div>
          <div className="quiz-stat-meta">
            <span className="quiz-stat-label">Total Attempts</span>
            <span className="quiz-stat-val">{stats.totalAttempts}</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="quiz-toolbar">
        <div className="quiz-toolbar-left">
          <div className="quiz-select-wrap">
            <label>Subject:</label>
            <select
              className="quiz-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {dashboardSubjects.map((s) => (
                <option key={s._id || s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="deck-search-wrap" style={{ minWidth: '240px' }}>
          <Search size={15} className="deck-search-icon" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Quizzes List / Empty State */}
      {isLoading ? (
        <div className="quiz-empty-state">
          <Loader2 size={36} className="animate-spin" color="#10a37f" />
          <p style={{ color: 'var(--text-muted)' }}>Loading your assessment quizzes...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="quiz-empty-state">
          <div className="quiz-empty-icon">
            <HelpCircle size={32} />
          </div>
          <h2 className="quiz-empty-title">No Quizzes Found</h2>
          <p className="quiz-empty-desc">
            {searchQuery || selectedSubject !== 'all'
              ? 'No assessment quizzes match your filter criteria.'
              : 'Generate your first AI assessment quiz grounded directly in your syllabus and completed coursework!'}
          </p>
          <button
            className="btn-quiz-primary"
            style={{ marginTop: '0.75rem' }}
            onClick={() => setIsGenModalOpen(true)}
          >
            <Brain size={16} /> Generate AI Quiz
          </button>
        </div>
      ) : (
        <div className="quiz-grid">
          {filteredQuizzes.map((q) => {
            const hasAttempted = q.bestScore !== null && q.bestScore !== undefined;

            return (
              <div key={q._id} className="quiz-card">
                <div className="quiz-card-top-content">
                  <div className="quiz-card-tags">
                    <span className="fc-badge subject">{q.subject}</span>
                    <span className={`fc-badge difficulty-${q.difficulty || 'mixed'}`}>
                      {q.difficulty || 'mixed'}
                    </span>
                  </div>

                  <h3 className="quiz-card-title" title={getDisplayTitle(q)}>
                    {getDisplayTitle(q)}
                  </h3>
                  <p className="quiz-card-topic" title={getDisplayTopic(q)}>
                    <HelpCircle size={13} style={{ flexShrink: 0 }} />
                    <span>Topic: {getDisplayTopic(q)}</span>
                  </p>
                </div>

                <div className="quiz-card-metrics">
                  <div className="quiz-metric-item">
                    <span className="quiz-metric-label">Questions</span>
                    <span className="quiz-metric-val">{q.totalQuestions} MCQs</span>
                  </div>
                  <div className="quiz-metric-item">
                    <span className="quiz-metric-label">Best Score</span>
                    <span
                      className="quiz-metric-val"
                      style={{ color: hasAttempted ? '#34d399' : 'var(--text-muted)' }}
                    >
                      {hasAttempted ? `${q.bestPercentage}%` : 'Not Taken'}
                    </span>
                  </div>
                  <div className="quiz-metric-item">
                    <span className="quiz-metric-label">Attempts</span>
                    <span className="quiz-metric-val">{q.attempts?.length || 0}</span>
                  </div>
                </div>

                <div className="quiz-card-footer">
                  <button
                    className="btn-start-quiz"
                    onClick={() => handleStartQuiz(q)}
                  >
                    <Play size={15} /> {hasAttempted ? 'Retake Quiz' : 'Start Quiz'}
                  </button>

                  {/* Direct delete button without confirmation modal */}
                  <button
                    className="btn-quiz-delete"
                    title="Delete Quiz"
                    onClick={(e) => handleDeleteQuiz(q._id, e)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==========================================================================
          MODAL: AI Quiz Generator
          ========================================================================== */}
      {isGenModalOpen && (
        <div className="quiz-modal-overlay" onClick={() => setIsGenModalOpen(false)}>
          <div className="quiz-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-modal-header">
              <div className="quiz-modal-title-wrap">
                <Brain size={20} color="#10a37f" />
                <h3 className="quiz-modal-title">Generate AI Assessment Quiz</h3>
              </div>
              <button
                className="btn-tile-icon"
                onClick={() => setIsGenModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateQuiz}>
              <div className="quiz-modal-body">
                {genFeedback.error && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: '#f87171',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <AlertCircle size={16} /> {genFeedback.error}
                  </div>
                )}

                {genFeedback.success && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(16, 163, 127, 0.15)',
                      border: '1px solid rgba(16, 163, 127, 0.3)',
                      borderRadius: '8px',
                      color: '#34d399',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Check size={16} /> {genFeedback.success}
                  </div>
                )}

                {/* Subject Selector */}
                <div className="quiz-form-group">
                  <label>Subject</label>
                  <select
                    value={genSubject}
                    onChange={(e) => setGenSubject(e.target.value)}
                    required
                  >
                    {dashboardSubjects.map((s) => (
                      <option key={s._id || s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Completed Topics Box */}
                <div className="quiz-completed-topics-box">
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399' }}>
                    Completed Syllabus Topics:
                  </span>
                  {completedTopicsForGen.length > 0 ? (
                    <div className="quiz-completed-badge-list">
                      {completedTopicsForGen.map((top, idx) => (
                        <span key={idx} className="quiz-topic-chip-check">
                          <Check size={12} /> {top}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      No topics marked completed yet. AI will generate questions covering the foundational concepts from your uploaded notes.
                    </p>
                  )}
                </div>

                {/* Topic Mode */}
                <div className="quiz-form-group">
                  <label>Question Scope</label>
                  <select
                    value={genTopicMode}
                    onChange={(e) => setGenTopicMode(e.target.value)}
                  >
                    <option value="completed">All Completed Topics</option>
                    <option value="all">Entire Subject / Uploaded Documents</option>
                    <option value="specific">Target a Specific Topic</option>
                  </select>
                </div>

                {genTopicMode === 'specific' && (
                  <div className="quiz-form-group">
                    <label>Specific Topic Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Lexical Analysis, Deadlocks, Normalization"
                      value={genSpecificTopic}
                      onChange={(e) => setGenSpecificTopic(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Questions Count & Difficulty */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="quiz-form-group">
                    <label>Number of MCQs</label>
                    <select
                      value={genCount}
                      onChange={(e) => setGenCount(parseInt(e.target.value, 10))}
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                    </select>
                  </div>

                  <div className="quiz-form-group">
                    <label>Difficulty</label>
                    <select
                      value={genDifficulty}
                      onChange={(e) => setGenDifficulty(e.target.value)}
                    >
                      <option value="mixed">Mixed (Recommended)</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard (Exam-level)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="quiz-modal-footer">
                <button
                  type="button"
                  className="btn-quiz-secondary"
                  onClick={() => setIsGenModalOpen(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-quiz-primary"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Generating Assessment...
                    </>
                  ) : (
                    <>
                      <Brain size={16} /> Generate Quiz
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizView;
