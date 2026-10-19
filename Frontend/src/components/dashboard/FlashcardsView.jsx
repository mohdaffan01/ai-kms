import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Sparkles,
  Plus,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Shuffle,
  Trash2,
  Search,
  BookOpen,
  Filter,
  Check,
  AlertCircle,
  Loader2,
  X,
  Lightbulb,
  Award,
  Grid,
  Play
} from 'lucide-react';
import {
  getFlashcardsApi,
  generateFlashcardsApi,
  createFlashcardApi,
  toggleFlashcardMasteredApi,
  deleteFlashcardApi,
  resetDeckMasteryApi
} from '../../api/flashcardApi';
import { getDashboardDataApi } from '../../api/progressApi';
import '../../styles/flashcards.css';

const FlashcardsView = ({ initialSubject = '' }) => {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState('study'); // 'study' | 'grid'
  
  // Filtering states
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || 'all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'learning' | 'mastered'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dashboard & subjects data for completed topics tracking
  const [dashboardSubjects, setDashboardSubjects] = useState([]);
  
  // Study Mode state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [deckCompleted, setDeckCompleted] = useState(false);

  // Modals state
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genSubject, setGenSubject] = useState('');
  const [genTopicMode, setGenTopicMode] = useState('completed'); // 'completed' | 'specific' | 'all'
  const [genSpecificTopic, setGenSpecificTopic] = useState('');
  const [genCount, setGenCount] = useState(5);
  const [genFeedback, setGenFeedback] = useState({ error: '', success: '' });

  // Manual Card Form State
  const [manualForm, setManualForm] = useState({
    subject: '',
    topic: '',
    front: '',
    back: '',
    hint: '',
    difficulty: 'medium',
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Stats aggregate
  const [deckStats, setDeckStats] = useState({
    totalCards: 0,
    masteredCards: 0,
    learningCards: 0,
    masteryPercentage: 0,
  });

  // 1. Fetch dashboard progress to identify all subjects and their completed topics
  const fetchProgressSubjects = async () => {
    try {
      const res = await getDashboardDataApi();
      if (res && res.subjects) {
        setDashboardSubjects(res.subjects);
        if (!genSubject && res.subjects.length > 0) {
          setGenSubject(res.subjects[0].name);
        }
      }
    } catch (err) {
      console.warn('Could not fetch progress subjects for flashcards:', err.message);
    }
  };

  // 2. Fetch Flashcards from backend
  const fetchFlashcards = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (selectedSubject && selectedSubject !== 'all') params.subject = selectedSubject;
      if (selectedTopic && selectedTopic !== 'all') params.topic = selectedTopic;
      if (statusFilter !== 'all') params.filter = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getFlashcardsApi(params);
      if (res && res.data) {
        setCards(res.data);
        if (res.stats) {
          setDeckStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Fetch flashcards error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubject, selectedTopic, statusFilter, searchQuery]);

  useEffect(() => {
    fetchProgressSubjects();
  }, []);

  useEffect(() => {
    fetchFlashcards();
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setDeckCompleted(false);
  }, [fetchFlashcards]);

  // Active Subject Object from Dashboard
  const activeDashboardSubj = dashboardSubjects.find(
    (s) => s.name?.toLowerCase() === (selectedSubject === 'all' ? genSubject?.toLowerCase() : selectedSubject?.toLowerCase())
  );

  // Extract completed topics for the selected subject
  const getSubjectCompletedTopics = (subjName) => {
    const s = dashboardSubjects.find((item) => item.name?.toLowerCase() === subjName?.toLowerCase());
    if (!s || !Array.isArray(s.topics)) return [];
    
    const completed = [];
    s.topics.forEach((t) => {
      if (t.completed) completed.push(t.name);
      if (Array.isArray(t.subtopics)) {
        t.subtopics.forEach((st) => {
          if (st.completed) completed.push(`${t.name}: ${st.name}`);
        });
      }
    });
    return completed;
  };

  const completedTopicsForGen = getSubjectCompletedTopics(genSubject || selectedSubject);

  // Navigation handlers
  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setDeckCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
      setDeckCompleted(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Toggle card mastery
  const handleToggleMastered = async (card, e) => {
    if (e) e.stopPropagation();
    const targetState = !card.isMastered;
    try {
      await toggleFlashcardMasteredApi(card._id, targetState);
      setCards((prev) =>
        prev.map((c) => (c._id === card._id ? { ...c, isMastered: targetState } : c))
      );
      setDeckStats((prev) => {
        const masteredCards = targetState ? prev.masteredCards + 1 : Math.max(0, prev.masteredCards - 1);
        const total = prev.totalCards || cards.length;
        return {
          ...prev,
          masteredCards,
          learningCards: Math.max(0, total - masteredCards),
          masteryPercentage: total > 0 ? Math.round((masteredCards / total) * 100) : 0,
        };
      });
    } catch (err) {
      console.error('Toggle mastery error:', err);
    }
  };

  // Delete card
  const handleDeleteCard = async (cardId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this flashcard?')) return;
    try {
      await deleteFlashcardApi(cardId);
      setCards((prev) => prev.filter((c) => c._id !== cardId));
      if (currentIndex >= cards.length - 1 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    } catch (err) {
      alert('Could not delete flashcard.');
    }
  };

  // Reset deck mastery
  const handleResetMastery = async () => {
    if (!window.confirm(`Reset progress and mark all cards in this deck as learning?`)) return;
    try {
      await resetDeckMasteryApi(selectedSubject);
      fetchFlashcards();
      setCurrentIndex(0);
      setIsFlipped(false);
      setDeckCompleted(false);
    } catch (err) {
      alert('Failed to reset deck mastery.');
    }
  };

  // Shuffle deck
  const handleShuffle = () => {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setDeckCompleted(false);
  };

  // Keyboard navigation listener
  useEffect(() => {
    if (mode !== 'study' || cards.length === 0 || isGenModalOpen || isManualModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '1') {
        // Needs practice
        if (cards[currentIndex]?.isMastered) {
          handleToggleMastered(cards[currentIndex]);
        }
      } else if (e.key === '2') {
        // Mastered
        if (!cards[currentIndex]?.isMastered) {
          handleToggleMastered(cards[currentIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentIndex, cards, isGenModalOpen, isManualModalOpen]);

  // AI Flashcard Generation Submit
  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!genSubject) {
      setGenFeedback({ error: 'Please choose a subject.', success: '' });
      return;
    }

    try {
      setIsGenerating(true);
      setGenFeedback({ error: '', success: '' });

      let targetTopic = 'all';
      if (genTopicMode === 'specific') {
        targetTopic = genSpecificTopic;
      }

      const res = await generateFlashcardsApi({
        subject: genSubject,
        topic: targetTopic,
        count: genCount,
      });

      if (res && res.success) {
        setGenFeedback({
          error: '',
          success: `✨ Success! Created ${res.count || genCount} flashcards.`,
        });

        // Switch active filter to this subject so user immediately sees their cards
        setSelectedSubject(genSubject);
        setSelectedTopic('all');
        await fetchFlashcards();
        
        setTimeout(() => {
          setIsGenModalOpen(false);
          setGenFeedback({ error: '', success: '' });
        }, 1200);
      }
    } catch (err) {
      console.error('Generate flashcards error:', err);
      setGenFeedback({
        error: err.response?.data?.message || 'Failed to generate flashcards. Please try again.',
        success: '',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual Flashcard Submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.subject || !manualForm.front || !manualForm.back) return;

    try {
      setIsSubmittingManual(true);
      const res = await createFlashcardApi(manualForm);
      if (res && res.success) {
        setIsManualModalOpen(false);
        setManualForm({
          subject: genSubject || '',
          topic: '',
          front: '',
          back: '',
          hint: '',
          difficulty: 'medium',
        });
        await fetchFlashcards();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create flashcard.');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0;

  // Distinct subjects list (merging from dashboard subjects and existing flashcards)
  const availableSubjectNames = [
    ...new Set([
      ...dashboardSubjects.map((s) => s.name),
      ...cards.map((c) => c.subject),
    ].filter(Boolean)),
  ].sort();

  return (
    <div className="flashcards-container">
      {/* Header */}
      <div className="flashcards-header">
        <div className="flashcards-header-left">
          <div className="flashcards-header-icon">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="flashcards-title">Smart Flashcards</h1>
            <p className="flashcards-subtitle">
              Interactive 3D revision cards generated directly from your studied topics & notes
            </p>
          </div>
        </div>

        <div className="flashcards-header-actions">
          {/* Mode Switcher */}
          <div className="fc-mode-toggle">
            <button
              type="button"
              className={`fc-mode-btn ${mode === 'study' ? 'active' : ''}`}
              onClick={() => setMode('study')}
            >
              <Play size={14} />
              <span>Study Deck</span>
            </button>
            <button
              type="button"
              className={`fc-mode-btn ${mode === 'grid' ? 'active' : ''}`}
              onClick={() => setMode('grid')}
            >
              <Grid size={14} />
              <span>All Cards</span>
            </button>
          </div>

          <button
            type="button"
            className="btn-fc-secondary"
            onClick={() => {
              setManualForm((prev) => ({
                ...prev,
                subject: selectedSubject !== 'all' ? selectedSubject : availableSubjectNames[0] || 'General',
              }));
              setIsManualModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Add Card</span>
          </button>

          <button
            type="button"
            className="btn-fc-primary"
            onClick={() => {
              setGenSubject(selectedSubject !== 'all' ? selectedSubject : (availableSubjectNames[0] || ''));
              setIsGenModalOpen(true);
            }}
          >
            <Sparkles size={16} />
            <span>Generate with AI</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Filters & Stats */}
      <div className="flashcards-toolbar">
        <div className="fc-filters-group">
          {/* Subject Filter */}
          <div className="fc-select-wrap">
            <label htmlFor="fc-filter-subject">Subject:</label>
            <select
              id="fc-filter-subject"
              className="fc-select"
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('all');
              }}
            >
              <option value="all">All Subjects</option>
              {availableSubjectNames.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="fc-select-wrap">
            <label htmlFor="fc-filter-status">Status:</label>
            <select
              id="fc-filter-status"
              className="fc-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="learning">Needs Practice</option>
              <option value="mastered">Mastered Only</option>
            </select>
          </div>
        </div>

        {/* Deck Stats chips */}
        <div className="fc-stats-bar">
          <span className="fc-stat-chip">
            <BookOpen size={13} />
            <span>{cards.length} Total Cards</span>
          </span>
          <span className="fc-stat-chip mastered">
            <CheckCircle2 size={13} />
            <span>{deckStats.masteredCards} Mastered ({deckStats.masteryPercentage}%)</span>
          </span>
          <span className="fc-stat-chip learning">
            <Clock size={13} />
            <span>{deckStats.learningCards} To Learn</span>
          </span>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="fc-empty-state">
          <Loader2 size={36} className="spinner" style={{ color: 'var(--accent-green)' }} />
          <p className="fc-empty-desc">Loading your flashcard deck...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="fc-empty-state">
          <div className="fc-empty-icon">
            <Layers size={32} />
          </div>
          <h3 className="fc-empty-title">No flashcards found</h3>
          <p className="fc-empty-desc">
            {selectedSubject !== 'all'
              ? `You don't have any flashcards for "${selectedSubject}" yet. Click "Generate with AI" to create flashcards from your completed study topics and uploaded notes!`
              : `Create your first deck by clicking "Generate with AI" or add custom cards manually.`}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn-fc-primary"
              onClick={() => {
                setGenSubject(selectedSubject !== 'all' ? selectedSubject : availableSubjectNames[0] || '');
                setIsGenModalOpen(true);
              }}
            >
              <Sparkles size={16} />
              <span>Generate with AI</span>
            </button>
            <button
              type="button"
              className="btn-fc-secondary"
              onClick={() => setIsManualModalOpen(true)}
            >
              <Plus size={16} />
              <span>Add Custom Card</span>
            </button>
          </div>
        </div>
      ) : mode === 'study' ? (
        /* ================= 3D STUDY DECK MODE ================= */
        <div className="study-mode-container">
          {/* Deck completion celebration */}
          {deckCompleted ? (
            <div className="fc-card-face" style={{ position: 'relative', width: '100%', maxWidth: '640px', minHeight: '340px', margin: '0 auto', textAlign: 'center', justifyContent: 'center' }}>
              <Award size={48} style={{ color: '#fde047', margin: '0 auto 1rem auto' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                🎉 Deck Completed!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                You have reviewed all {cards.length} cards in this deck! Overall mastery: <strong style={{ color: '#34d399' }}>{deckStats.masteryPercentage}%</strong>.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-fc-primary"
                  onClick={() => {
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setDeckCompleted(false);
                  }}
                >
                  <RotateCw size={15} />
                  <span>Restart Deck</span>
                </button>
                <button
                  type="button"
                  className="btn-fc-secondary"
                  onClick={handleShuffle}
                >
                  <Shuffle size={15} />
                  <span>Shuffle & Practice</span>
                </button>
                <button
                  type="button"
                  className="btn-fc-secondary"
                  onClick={handleResetMastery}
                >
                  <span>Reset Mastery</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Progress Bar & Header */}
              <div className="study-progress-wrapper">
                <div className="study-progress-info">
                  <span>
                    Card <strong>{currentIndex + 1}</strong> of <strong>{cards.length}</strong>
                  </span>
                  <span>{progressPercent}% Deck Progress</span>
                </div>
                <div className="study-progress-track">
                  <div
                    className="study-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* 3D Flip Card Scene */}
              <div className="fc-card-scene" onClick={handleFlip}>
                <div className={`fc-card-flipper ${isFlipped ? 'flipped' : ''}`}>
                  {/* FRONT FACE (Question / Prompt) */}
                  <div className="fc-card-face fc-card-front">
                    <div className="fc-card-top-meta">
                      <div className="fc-card-tags">
                        <span className="fc-badge subject">{currentCard.subject}</span>
                        <span className="fc-badge topic">{currentCard.topic}</span>
                        <span className={`fc-badge difficulty-${currentCard.difficulty || 'medium'}`}>
                          {currentCard.difficulty}
                        </span>
                      </div>
                      {currentCard.isMastered && (
                        <div className="fc-mastered-indicator" title="Mastered">
                          <CheckCircle2 size={14} />
                          <span>Mastered</span>
                        </div>
                      )}
                    </div>

                    <div className="fc-card-content">
                      <span className="fc-card-side-label">Prompt / Concept</span>
                      <p className="fc-card-text">{currentCard.front}</p>

                      {currentCard.hint && (
                        <div
                          className="fc-card-hint-box"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHint(!showHint);
                          }}
                        >
                          <Lightbulb size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          {showHint ? (
                            <span>{currentCard.hint}</span>
                          ) : (
                            <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                              Need a hint? Click here
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="fc-card-bottom-prompt">
                      <RotateCw size={13} />
                      <span>Click card or press Space to reveal answer</span>
                    </div>
                  </div>

                  {/* BACK FACE (Answer / In-depth Explanation) */}
                  <div className="fc-card-face fc-card-back">
                    <div className="fc-card-top-meta">
                      <div className="fc-card-tags">
                        <span className="fc-badge subject">{currentCard.subject}</span>
                        <span className="fc-badge topic">{currentCard.topic}</span>
                      </div>
                      {currentCard.isMastered && (
                        <div className="fc-mastered-indicator">
                          <CheckCircle2 size={14} />
                          <span>Mastered</span>
                        </div>
                      )}
                    </div>

                    <div className="fc-card-content">
                      <span className="fc-card-side-label">Detailed Explanation & Answer</span>
                      <p className="fc-card-text">{currentCard.back}</p>
                    </div>

                    <div className="fc-card-bottom-prompt">
                      <RotateCw size={13} />
                      <span>Click card or press Space to flip back</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Study Controls */}
              <div className="study-controls">
                <button
                  type="button"
                  className="study-nav-btn"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  title="Previous Card (Left Arrow)"
                >
                  <ChevronLeft size={22} />
                </button>

                <div className="study-actions-center">
                  <button
                    type="button"
                    className="btn-flip-card"
                    onClick={handleFlip}
                  >
                    <RotateCw size={15} />
                    <span>Flip Card</span>
                  </button>

                  <button
                    type="button"
                    className={currentCard.isMastered ? 'btn-mark-learning' : 'btn-mark-mastered'}
                    onClick={(e) => handleToggleMastered(currentCard, e)}
                    title="Toggle Mastery (Press 1 or 2)"
                  >
                    <CheckCircle2 size={16} />
                    <span>{currentCard.isMastered ? 'Mark as Learning' : 'Mark as Mastered'}</span>
                  </button>

                  <button
                    type="button"
                    className="study-nav-btn"
                    onClick={handleShuffle}
                    title="Shuffle Deck"
                  >
                    <Shuffle size={17} />
                  </button>
                </div>

                <button
                  type="button"
                  className="study-nav-btn"
                  onClick={handleNext}
                  title="Next Card (Right Arrow)"
                >
                  <ChevronRight size={22} />
                </button>
              </div>

              {/* Shortcuts hint */}
              <div className="study-shortcuts-hint">
                <span>
                  <kbd>Space</kbd> Flip
                </span>
                <span>
                  <kbd>&larr;</kbd> <kbd>&rarr;</kbd> Navigate
                </span>
                <span>
                  <kbd>1</kbd> Practice / <kbd>2</kbd> Mastered
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ================= DECK GRID VIEW ================= */
        <div className="deck-grid-container">
          <div className="deck-grid-header">
            <div className="deck-search-wrap">
              <Search size={16} className="deck-search-icon" />
              <input
                type="text"
                placeholder="Search flashcards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Showing {cards.length} cards
            </div>
          </div>

          <div className="deck-cards-grid">
            {cards.map((card) => (
              <div
                key={card._id}
                className={`deck-card-tile ${card.isMastered ? 'mastered' : ''}`}
              >
                <div className="deck-tile-meta">
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <span className="fc-badge subject">{card.subject}</span>
                    <span className="fc-badge topic">{card.topic}</span>
                  </div>
                  <span className={`fc-badge difficulty-${card.difficulty || 'medium'}`}>
                    {card.difficulty}
                  </span>
                </div>

                <h4 className="deck-tile-front">{card.front}</h4>
                <p className="deck-tile-back">{card.back}</p>

                <div className="deck-tile-footer">
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Reviewed {card.reviewCount || 0} times
                  </span>

                  <div className="deck-tile-actions">
                    <button
                      type="button"
                      className={`btn-tile-icon star ${card.isMastered ? 'active' : ''}`}
                      onClick={(e) => handleToggleMastered(card, e)}
                      title={card.isMastered ? 'Mark as Learning' : 'Mark as Mastered'}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-tile-icon delete"
                      onClick={(e) => handleDeleteCard(card._id, e)}
                      title="Delete Flashcard"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: AI FLASHCARD GENERATOR ================= */}
      {isGenModalOpen && (
        <div className="fc-modal-overlay" onClick={() => !isGenerating && setIsGenModalOpen(false)}>
          <div className="fc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-header">
              <div className="fc-modal-title-wrap">
                <Sparkles size={18} style={{ color: 'var(--accent-green)' }} />
                <h3 className="fc-modal-title">Generate Flashcards with AI</h3>
              </div>
              <button
                type="button"
                className="btn-tile-icon"
                onClick={() => !isGenerating && setIsGenModalOpen(false)}
                disabled={isGenerating}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit}>
              <div className="fc-modal-body">
                {/* Subject Selector */}
                <div className="fc-form-group">
                  <label htmlFor="gen-subj-select">Target Subject *</label>
                  <select
                    id="gen-subj-select"
                    value={genSubject}
                    onChange={(e) => setGenSubject(e.target.value)}
                    disabled={isGenerating}
                    required
                  >
                    {availableSubjectNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Display Completed Topics Found for this Subject */}
                <div className="fc-completed-topics-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399' }}>
                      ⚡ Completed Topics Found in Your Study Progress ({completedTopicsForGen.length})
                    </span>
                  </div>

                  {completedTopicsForGen.length > 0 ? (
                    <div className="fc-completed-badge-list">
                      {completedTopicsForGen.map((topName) => (
                        <span key={topName} className="fc-topic-chip-check">
                          <Check size={11} />
                          {topName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                      No topics marked completed yet in your checklist for "{genSubject}". Flashcards will be generated based on curriculum concepts and uploaded notes!
                    </p>
                  )}
                </div>

                {/* Topic Mode */}
                <div className="fc-form-group">
                  <label>Generation Scope</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="topicMode"
                        checked={genTopicMode === 'completed'}
                        onChange={() => setGenTopicMode('completed')}
                        disabled={isGenerating}
                      />
                      {completedTopicsForGen.length > 0 ? 'All Completed Topics' : 'Full Subject Curriculum'}
                    </label>

                    <label style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="topicMode"
                        checked={genTopicMode === 'specific'}
                        onChange={() => setGenTopicMode('specific')}
                        disabled={isGenerating}
                      />
                      Specific Topic Only
                    </label>
                  </div>
                </div>

                {genTopicMode === 'specific' && (
                  <div className="fc-form-group">
                    <label htmlFor="gen-spec-topic">Topic Name *</label>
                    <input
                      id="gen-spec-topic"
                      type="text"
                      placeholder="e.g. Normalization (1NF, 2NF, 3NF, BCNF) or ER Diagram"
                      value={genSpecificTopic}
                      onChange={(e) => setGenSpecificTopic(e.target.value)}
                      required={genTopicMode === 'specific'}
                      disabled={isGenerating}
                    />
                  </div>
                )}

                {/* Card Count */}
                <div className="fc-form-group">
                  <label htmlFor="gen-count">Number of Flashcards (2 - 15)</label>
                  <input
                    id="gen-count"
                    type="number"
                    min="2"
                    max="15"
                    value={genCount}
                    onChange={(e) => setGenCount(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                {/* Status Feedback */}
                {genFeedback.error && (
                  <div style={{ color: '#f87171', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={15} />
                    <span>{genFeedback.error}</span>
                  </div>
                )}
                {genFeedback.success && (
                  <div style={{ color: '#34d399', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={15} />
                    <span>{genFeedback.success}</span>
                  </div>
                )}
              </div>

              <div className="fc-modal-footer">
                <button
                  type="button"
                  className="btn-fc-secondary"
                  onClick={() => setIsGenModalOpen(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-fc-primary"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Generating with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate Deck</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: MANUAL ADD FLASHCARD ================= */}
      {isManualModalOpen && (
        <div className="fc-modal-overlay" onClick={() => !isSubmittingManual && setIsManualModalOpen(false)}>
          <div className="fc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-header">
              <div className="fc-modal-title-wrap">
                <Plus size={18} style={{ color: 'var(--accent-green)' }} />
                <h3 className="fc-modal-title">Add Custom Flashcard</h3>
              </div>
              <button
                type="button"
                className="btn-tile-icon"
                onClick={() => !isSubmittingManual && setIsManualModalOpen(false)}
                disabled={isSubmittingManual}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit}>
              <div className="fc-modal-body">
                <div className="fc-form-group">
                  <label htmlFor="manual-subj">Subject *</label>
                  <input
                    id="manual-subj"
                    type="text"
                    placeholder="e.g. DBMS"
                    value={manualForm.subject}
                    onChange={(e) => setManualForm({ ...manualForm, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="fc-form-group">
                  <label htmlFor="manual-topic">Topic</label>
                  <input
                    id="manual-topic"
                    type="text"
                    placeholder="e.g. Relational Calculus"
                    value={manualForm.topic}
                    onChange={(e) => setManualForm({ ...manualForm, topic: e.target.value })}
                  />
                </div>

                <div className="fc-form-group">
                  <label htmlFor="manual-front">Prompt / Question (Front) *</label>
                  <textarea
                    id="manual-front"
                    rows="3"
                    placeholder="What is the concept or question to test?"
                    value={manualForm.front}
                    onChange={(e) => setManualForm({ ...manualForm, front: e.target.value })}
                    required
                  />
                </div>

                <div className="fc-form-group">
                  <label htmlFor="manual-back">Detailed Answer / Explanation (Back) *</label>
                  <textarea
                    id="manual-back"
                    rows="4"
                    placeholder="The accurate definition, formula, or key takeaway"
                    value={manualForm.back}
                    onChange={(e) => setManualForm({ ...manualForm, back: e.target.value })}
                    required
                  />
                </div>

                <div className="fc-form-group">
                  <label htmlFor="manual-hint">Memory Hint (Optional)</label>
                  <input
                    id="manual-hint"
                    type="text"
                    placeholder="Quick clue if you get stuck"
                    value={manualForm.hint}
                    onChange={(e) => setManualForm({ ...manualForm, hint: e.target.value })}
                  />
                </div>

                <div className="fc-form-group">
                  <label htmlFor="manual-diff">Difficulty</label>
                  <select
                    id="manual-diff"
                    value={manualForm.difficulty}
                    onChange={(e) => setManualForm({ ...manualForm, difficulty: e.target.value })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="fc-modal-footer">
                <button
                  type="button"
                  className="btn-fc-secondary"
                  onClick={() => setIsManualModalOpen(false)}
                  disabled={isSubmittingManual}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-fc-primary"
                  disabled={isSubmittingManual}
                >
                  {isSubmittingManual ? 'Saving...' : 'Save Flashcard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardsView;
